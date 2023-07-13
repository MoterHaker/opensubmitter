/// <reference path="../../templates/type.d.ts" />
/// <reference path="../../src/type.d.ts" />
import {app, ipcMain} from 'electron'
import { join } from 'node:path'
const { dialog } = require('electron')
import ts, {ScriptTarget} from "typescript"
import { utilityProcess } from "electron";
import fs from "fs"
import os, {tmpdir} from 'os';


class InternalAPI {

    currentTemplateClass = null;
    currentTemplateObject?: OpenSubmitterTemplateProtocol | null = null;
    currentTasks: TemplateTask[] = [];
    threads: TemplateControllerChild[] = [];
    isRunningAllowed = true;
    compiledTemplateFilePath = null;
    compiledTemplateDir = null;
    selectedTemplateFilePath = null;
    taskThreadsAmount = 10;
    eventHook = null;
    puppeteerExecutablePath = null;
    asarExtractedDirectory = null;
    previousFullModulesPath = null;
    freedThreadNumbers: number[] = [];

    startListening(): void {
        ipcMain.on('TM', async(e, data) => {
            if (!data.type) return;
            this.eventHook = e;
            switch (data.type) {

                case 'select-existing-template':
                    this.selectedTemplateFilePath = data.fileName;
                    await this.selectTemplateFile();
                    this.loadTemplateSettings();
                    this.sendTemplateSettings();
                    break;

                case 'select-template-dialog':
                    await this.openTemplateDialog();
                    break;

                case 'run-opened-file':
                    if (this.currentTemplateObject.config.multiThreadingEnabled) {
                        this.taskThreadsAmount = data.threadsNumber;
                    } else {
                        this.taskThreadsAmount = 1;
                    }
                    await this.runOpenedTemplate(e);
                    break;

                case 'select-file-for-template-settings':
                    await this.selectFileForTemplateSettings(e, data);
                    break;

                case 'stop-job':
                    this.isRunningAllowed = false;
                    this.killThreads();
                    this.moveAsarModulesBack();
                    break;

                case 'read-local-templates':
                    await this.readLocalTemplates();
                    break;

                case 'reset-template-settings':
                    await this.resetTemplateSettings();
                    break;

            }

        });
    }

    async readLocalTemplates(): Promise<void> {
        let templatesPath, templateParentPath;
        const slash = process.platform === 'win32' ? "\\" : '/';
        if (this.isDevelopmentEnv()) {
            templatesPath = join(__dirname, `..${slash}..${slash}templates`);
            templateParentPath = join(__dirname, `..${slash}..${slash}electron${slash}main${slash}templateController.ts`);
        } else {
            templatesPath = join(process.resourcesPath, 'templates')
            templateParentPath = join(process.resourcesPath, `src${slash}templateController.ts`)
        }

        //reading parent template controller contents
        const templateParentContent = fs.readFileSync(templateParentPath).toString().split("//cut")[1];
        
        //listing templates directory
        const templatesList = fs.readdirSync(templatesPath, {withFileTypes: true})
                                .filter(item => {
                                    if (item.isDirectory()) return false;
                                    let ext = item.name.substring(item.name.indexOf('.')+1);
                                    return ['ts','js'].indexOf(ext) !== -1;
                                })
                                .map(item => item.name)

        //temporary dir for compiled templates
        const compiledPathDir = tmpdir() + `${slash}opsub_compiled`;
        const node_modulesDir = `${compiledPathDir}${slash}node_modules`;
        if (!fs.existsSync(compiledPathDir)) fs.mkdirSync(compiledPathDir);
        if (!fs.existsSync(node_modulesDir)) {
            fs.mkdirSync(node_modulesDir)
            fs.mkdirSync(`${node_modulesDir}${slash}axios`)
            fs.mkdirSync(`${node_modulesDir}${slash}puppeteer`)
            fs.writeFileSync(`${node_modulesDir}${slash}axios${slash}index.js`,"module.export={}");
            fs.writeFileSync(`${node_modulesDir}${slash}puppeteer${slash}index.js`,"module.export={}");
        }

        const result: LocalTemplateListItem[] = [];
        for (const templateFile of templatesList) {
            const templatePath = `${templatesPath}${slash}${templateFile}`;
            let compiledPath = `${compiledPathDir}${slash}${templateFile}.cjs`;

            //combined Typescript contents of template and its parent controller
            const contentTS = fs.readFileSync(templatePath).toString() + templateParentContent;

            let contentJS;
            try {

                //compiling TS into JS, saving into .cjs file
                contentJS = this.tsCompile(contentTS);
                fs.writeFileSync(compiledPath, contentJS);

                //importing compiled module
                if (process.platform === 'win32') {
                    compiledPath = `file:///${compiledPath}`.replace('\\', '/');
                }

                //creating new template object and getting configuration
                const { TemplateController } = await import(compiledPath);
                const templateObject = new TemplateController() as OpenSubmitterTemplateProtocol;

                //extracting name and other data from template
                if (templateObject.config && templateObject.config.name) {
                    result.push({
                        name: templateObject.config.name,
                        description: templateObject.config?.description,
                        filePath: templatePath
                    });
                }

            } catch (e) {
                console.log('could not compile: '+e.toString())
            }

        }

        //sending to Vue
        this.eventHook.reply('TaskManager', {
            type: 'template-file-list',
            list: result
        })
    }

    async selectFileForTemplateSettings(e, data) {
        if (data.dialogType === 'open') {
            const files: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({properties: ['openFile']});
            if (!files || files.canceled) {
                return;
            } else {
                this.currentTemplateObject.config.userSettings[data.index]["fileName"] = files.filePaths[0];
            }
        }
        if (data.dialogType === 'save') {
            const files: Electron.SaveDialogReturnValue = await dialog.showSaveDialog({properties: ['showOverwriteConfirmation']});
            if (!files || files.canceled) {
                return;
            } else {
                this.currentTemplateObject.config.userSettings[data.index]["fileName"] = files.filePath;
            }
        }
        e.reply('TaskManager', {
            type: 'set-template-config',
            config: this.currentTemplateObject.config,
            taskThreadsAmount: this.taskThreadsAmount
        })
    }

    async openTemplateDialog() {
        const files: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({ properties: ['openFile'] });
        if (!files || files.canceled) {
            console.log('canceled file opening')
            return;
        }

        this.selectedTemplateFilePath = files.filePaths[0];
        await this.selectTemplateFile();
        this.loadTemplateSettings();
        this.sendTemplateSettings();
    }

    async selectTemplateFile(): Promise<void> {

        const slash = process.platform === 'win32' ? "\\" : '/';

        let templateParentPath = null;
        if (this.isDevelopmentEnv()) {
            templateParentPath = join(__dirname, `..${slash}..${slash}electron${slash}main${slash}templateController.ts`);
        } else {
            templateParentPath = join(process.resourcesPath, `src${slash}templateController.ts`)
        }
        
        //reading parent template controller contents
        const templateParentContent = fs.readFileSync(templateParentPath).toString().split("//cut")[1];


        //defining a directory for compiled template
        this.compiledTemplateDir = tmpdir() + `${slash}opsubcompiledcustom`;
        this.compiledTemplateFilePath = `${this.compiledTemplateDir}${slash}index${Math.random()}.cjs`

        //directory for extracted contents of app.asar archive
        this.asarExtractedDirectory = tmpdir() + `${slash}opensubmitter-asar`;

        if (!fs.existsSync(this.compiledTemplateDir)) fs.mkdirSync(this.compiledTemplateDir);

        //temporary modules instead of heavy real node_modules
        this.putFakeModuleReplacements();

        //set the path to puppetter Chrome browser depending on the platform
        this.definePuppeteerExecutablePath();


        let contentJS = null;
        let contentTS = null;

        try {
            contentTS = fs.readFileSync(this.selectedTemplateFilePath).toString();
        } catch (e) {
            this.eventHook.reply('TaskManager', {type: 'set-template-name-error', error: "Could not open "+this.selectedTemplateFilePath})
            return;
        }

        //merging together template contents with parent controller
        contentTS = contentTS + templateParentContent;

        try {
            //compiling them into JavaScript
            contentJS = this.tsCompile(contentTS);
        } catch (e) {
            this.eventHook.reply('TaskManager', {type: 'set-template-name-error', error: "Could not compile TypeScript to Javascript"})
            return;
        }

        //setting puppeteer executable path in the parent template controller
        contentJS = contentJS.replace('%PUPPETEER_EXECUTABLE_PATH%', this.puppeteerExecutablePath);

        try {
            //writing contents to Javascript module file
            fs.writeFileSync(this.compiledTemplateFilePath, contentJS);
        } catch (e) {
            this.eventHook.repnply('TaskManager', {type: 'set-template-name-error', error: "Could not write compiled code to file "+this.compiledTemplateFilePath})
            return;
        }


        try {

            //importing compiled module
            let importPath = this.compiledTemplateFilePath
            if (process.platform === 'win32') {
                importPath = `file:///${this.compiledTemplateFilePath}`.replace('\\', '/');
            }

            const { TemplateController } = await import(importPath);

            //creating new template controller which contains the template
            this.currentTemplateObject = new TemplateController();

        } catch (e) {
            console.error(`could not open cjs file ${this.compiledTemplateFilePath}: `, e.toString());
            this.eventHook.reply('TaskManager', {type: 'set-template-name-error', error: `Could not import script from template`})
            return;
        }

        //responding to UI with file name and no errors status
        this.eventHook.reply('TaskManager', { type: 'set-template-name', filename: this.selectedTemplateFilePath })
        this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "" })

        if (!this.currentTemplateObject.config) {
            console.log('no config in the template')
            return;
        }
    }

    async childMessageHandler(child: UtilityProcess, message: MessageWithType): Promise<void> {
        for (const thread of this.threads) {
            if (thread.child.pid === child.pid) {

                switch (message.type) {
                    case 'log-update':
                        thread.textStatus = message.data.message;
                        this.eventHook.reply('TaskManager', {
                            type: 'add-log-message',
                            message: 'thread '+thread.threadNumber + ": " + message.data.message
                        })
                        break;
                }

                return;
            }
        }
    }

    postThreadStatuses(): void {
        const data: ThreadStatus[] = [];
        for (const thread of this.threads) {
            data.push({
                thread: thread.threadNumber,
                status: thread.textStatus
            })
        }
        this.eventHook.reply('TaskManager', {
            type: 'set-thread-statuses',
            statuses: data
        })
    }

    printThreadsStatuses(): void {
        for (const thread of this.threads) {
            console.log(`thread #${thread.threadNumber}, PID ${thread.child.pid} status: ${thread.textStatus}`)
        }
        console.log("\n\n");
    }

    addToParentLog(message): void {
        console.log(message);
        this.eventHook.reply('TaskManager', {
            type: 'add-log-message',
            message: message
        })
    }

    async runOpenedTemplate(event): Promise<void> {

        this.eventHook = event;
        this.saveTemplateSettings();
        console.log("\n\n\n======NEW RUN======\n");

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Preparing modules',
                completed: 0,
                pending: 0
            }
        })

        await this.extractNodeModules();

        this.isRunningAllowed = true;


        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Generating tasks',
                completed: 0,
                pending: 0
            }
        })
        this.addToParentLog('Generating tasks..');
        try {
            this.currentTasks = await this.currentTemplateObject.generateTasks();
        } catch (e) {
            this.addToParentLog('Template error: '+e.toString())
            event.reply('TaskManager', {
                type: 'set-running-status',
                statusData: {
                    status: 'Template error: '+e.toString(),
                    completed: 0,
                    pending: 0
                }
            })
            return;
        }
        console.log('this.currentTasks ' + JSON.stringify(this.currentTasks));

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Running tasks',
                completed: 0,
                active: this.threads.length,
                pending: this.currentTasks.length
            }
        })

        let completedTasks = 0;
        let threadQueueNumber = 1;


        while (true) {

            if (!this.isRunningAllowed) {
                break;
            }

            this.postThreadStatuses();


            if (this.threads.length >= this.taskThreadsAmount) {
                await this.delay(1000);
                continue;
            }

            const task = this.getNextTask();
            if (!task) {
                console.log('no more tasks left')
                if (this.threads.length > 0) {
                    console.log('some threads are still running: ', this.threads.length);
                    await this.delay(500);
                    continue;
                } else {
                    this.addToParentLog('All threads have finished their work')
                    break;
                }
            }


            try {
                const child = utilityProcess
                    .fork(this.compiledTemplateFilePath)
                    .on("spawn", () => {
                        // console.log("spawned new utilityProcess " + child.pid)
                        child.postMessage({
                            'type': "start-task",
                            "pid": child.pid,
                            "task": task,
                            "config": this.currentTemplateObject.config ? this.currentTemplateObject.config : null
                        } as TaskMessage)
                    })
                    .on('message', async (data) => {
                        await this.childMessageHandler(child, data)
                    })
                    .on("exit", (code) => {
                        this.threads = this.threads.filter(thread => {
                            if (thread.child.pid !== child.pid) {
                                return true;
                            } else {
                                this.freedThreadNumbers.push(thread.threadNumber);
                                return false;
                            }
                        });
                        // console.log("exiting utilityProcess pid " + child.pid)
                        completedTasks++;
                        event.reply('TaskManager', {
                            type: 'set-running-status',
                            statusData: {
                                status: 'Running tasks',
                                completed: completedTasks,
                                active: this.threads.length,
                                pending: this.currentTasks.length
                            }
                        })
                    });

                let newThreadNumber = this.freedThreadNumbers.pop();
                if (typeof newThreadNumber === "undefined") {
                    newThreadNumber = threadQueueNumber;
                    threadQueueNumber++;
                }

                this.threads.push({
                    child,
                    threadNumber: newThreadNumber,
                    textStatus: "Started thread"
                })

                event.reply('TaskManager', {
                    type: 'set-running-status',
                    statusData: {
                        status: 'Running tasks',
                        completed: completedTasks,
                        active: this.threads.length,
                        pending: this.currentTasks.length
                    }
                })

            } catch (e) {
                this.addToParentLog("Could not start thread process: "+e.toString())
            }

        }

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Job complete',
                completed: completedTasks,
                active: this.threads.length,
                pending: this.currentTasks.length
            }
        })

        console.log('Removing temporary directory with compiled script');
        this.moveAsarModulesBack();
        await this.rmDirRecursive(this.compiledTemplateDir);
        this.addToParentLog(`Done! Completed ${completedTasks} tasks`);
    }

    getNextTask(): TemplateTask | null {
        if (this.currentTasks.length === 0) return null;
        return this.currentTasks.pop();
    }

    tsCompile(source: string): string {
        return ts.transpileModule(source, { compilerOptions: {
                target: ScriptTarget.ESNext,
                esModuleInterop: true,
                strict: true,
                noEmitOnError: true,
                strictFunctionTypes: true
            }}).outputText;
    }

    delay(time): Promise<void> {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
    }

    isDevelopmentEnv(): boolean {
        return process.env && process.env.NODE_ENV && process.env.NODE_ENV === "development";
    }

    /**
     * Put empty axios and puppeteer modules into temporary directory instead of
     * copying the whole node_modules or extracting app.arar file.
     * User might change his mind and choose another template, so we extract real
     * node_modules just before the template start.
     */
    putFakeModuleReplacements(): void {
        const slash = process.platform === 'win32' ? "\\" : '/';
        if (fs.existsSync(`${this.compiledTemplateDir}${slash}node_modules`)) return;
        fs.mkdirSync(`${this.compiledTemplateDir}${slash}node_modules`);
        fs.mkdirSync(`${this.compiledTemplateDir}${slash}node_modules${slash}axios`);
        fs.mkdirSync(`${this.compiledTemplateDir}${slash}node_modules${slash}puppeteer`);
        fs.writeFileSync(`${this.compiledTemplateDir}${slash}node_modules${slash}axios${slash}index.js`,"module.export={}");
        fs.writeFileSync(`${this.compiledTemplateDir}${slash}node_modules${slash}puppeteer${slash}index.js`,"module.export={}");
    }

    async extractNodeModules(): Promise<void> {

        const slash = process.platform === 'win32' ? "\\" : '/';
        let extractorPath = null;
        if (this.isDevelopmentEnv()) {
            extractorPath = join(__dirname, `..${slash}..${slash}electron${slash}main${slash}asarextractor.js`);
        } else {
            extractorPath = join(process.resourcesPath, `src${slash}asarextractor.js`)
        }

        if (!this.isDevelopmentEnv()) {

            //extracting app.asar if not extracted yet
            if (!this.asarExtractedDirectory || !fs.existsSync(`${this.asarExtractedDirectory}${slash}dist${slash}bundled-node-modules${slash}modules`)){

                await new Promise((resolve, reject) => {
                    const child = utilityProcess
                        .fork(extractorPath)
                        .on("spawn", () => {
                            child.postMessage({
                                'type': "prepare-production",
                                "asarExtractedDirectory": this.asarExtractedDirectory,
                                "appPath": app.getAppPath()
                            })
                        })
                        .on("exit", (code) => {
                            resolve(code)
                        });
                })
            }

            const fullModulesPath = `${this.asarExtractedDirectory}${slash}dist${slash}bundled-node-modules${slash}modules`;
            const targetModulesPath = this.compiledTemplateDir + `${slash}node_modules`;

            if (fs.existsSync(targetModulesPath)) {
                console.log('removing fake dir', targetModulesPath);
                await this.rmDirRecursive(targetModulesPath);
            }
            console.log('moving', fullModulesPath, 'to', targetModulesPath);
            fs.renameSync(fullModulesPath, targetModulesPath)


        } else {

            // Developer mode
            // Copying files from local public/bundled-node-modules/modules

            await new Promise((resolve, reject) => {
                const child = utilityProcess
                    .fork(extractorPath)
                    .on("spawn", () => {
                        child.postMessage({
                            'type': "prepare-development",
                            "sourceModulesPath": join(app.getAppPath()+`${slash}public${slash}bundled-node-modules${slash}modules`),
                            "targetModulesPath":join(this.compiledTemplateDir + `${slash}node_modules`)
                        })
                    })
                    .on("exit", (code) => {
                        resolve(code)
                    });
            })

        }
        console.log('node_modules prepared');
    }

    definePuppeteerExecutablePath(): void {
        let executablePath = '';
        const slash = process.platform === 'win32' ? "\\" : '/';
        const version = '114.0.5735.133';

        switch (process.platform) {
            case 'darwin':
                if (process.arch === 'arm64') {
                    executablePath = `mac_arm-${version}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
                } else {
                    executablePath = `mac-${version}/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
                }
                break;

            case 'linux':
                executablePath = `linux-${version}/chrome-linux/chrome`;
                break;

            case 'win32':
                if (process.arch === 'x64' || (os.arch() === 'arm64' && this.isWindows11(os.release()))) {
                    executablePath = `win64-${version}\\chrome-win64\\chrome.exe`;
                } else {
                    executablePath = `win32-${version}\\chrome-win32\\chrome.exe`;
                }
                break;
        }


        if (!this.isDevelopmentEnv()) {
            this.puppeteerExecutablePath = `${this.asarExtractedDirectory}${slash}dist${slash}puppeteer${slash}${executablePath}`;
        } else {
            this.puppeteerExecutablePath = join(app.getAppPath(), `${slash}public${slash}puppeteer${slash}${executablePath}`);

        }
        if (process.platform === 'win32') {
            //making double quotes, so it could work in the template variable %PUPPETEER_EXECUTABLE_PATH%
            this.puppeteerExecutablePath = this.puppeteerExecutablePath.replace(/\\/g, "\\\\");
        }

    }

    //got it from puppeteer/browser/src/detectPlatform.ts
    isWindows11(version: string): boolean {
        const parts = version.split('.');
        if (parts.length > 2) {
            const major = parseInt(parts[0] as string, 10);
            const minor = parseInt(parts[1] as string, 10);
            const patch = parseInt(parts[2] as string, 10);
            return (
                major > 10 ||
                (major === 10 && minor > 0) ||
                (major === 10 && minor === 0 && patch >= 22000)
            );
        }
        return false;
    }

    moveAsarModulesBack(): void {
        if (this.asarExtractedDirectory && !this.isDevelopmentEnv()) {
            const slash = process.platform === 'win32' ? "\\" : '/';
            const fullModulesPath = `${this.asarExtractedDirectory}${slash}dist${slash}bundled-node-modules${slash}modules`;
            const targetModulesPath = this.compiledTemplateDir + `${slash}node_modules`;
            if (!fs.existsSync(targetModulesPath)) {
                console.log('moveAsarDirectoryBack: targetModulesPath does not exist: ',targetModulesPath);
                return;
            }
            fs.renameSync(targetModulesPath, fullModulesPath);
            console.log('moved modules back from', targetModulesPath, 'to', fullModulesPath);
        }
    }

    killThreads(): void {
        for (const thread of this.threads) {
            thread.child.kill()
        }
        this.threads = [];
    }

    saveTemplateSettings(): void {
        if (!this.currentTemplateObject.config || !this.currentTemplateObject.config.userSettings) return; //non-existing config
        let config = {};
        const configPath = this.getSettingsFilePath();
        if (fs.existsSync(configPath)) {
            try {
                config = JSON.parse(fs.readFileSync(configPath).toString())
            } catch (e) {
                //default empty config
            }
        }
        config[this.currentTemplateObject.config.name] = [];
        //loop through settings and extract field values
        if (this.currentTemplateObject.config && this.currentTemplateObject.config.userSettings) {
            for (const setting of this.currentTemplateObject.config.userSettings) {
                config[this.currentTemplateObject.config.name].push({
                    name: setting.name,
                    value: setting.value,
                    fileName: setting.fileName
                });
            }
        }
        config[this.currentTemplateObject.config.name].push({
            name: '__taskThreadsAmount',
            value: this.taskThreadsAmount
        })
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2)); //save with pretty-printing
    }

    loadTemplateSettings(): void {
        if (!this.currentTemplateObject.config || !this.currentTemplateObject.config.userSettings) return; //non-existing config
        const configPath = this.getSettingsFilePath();
        if (!fs.existsSync(configPath)) return;
        try {
            const config = JSON.parse(fs.readFileSync(configPath).toString());
            if (typeof config[this.currentTemplateObject.config.name] === "undefined") return;

            //loop through saved settings
            for (const existingSetting of config[this.currentTemplateObject.config.name]) {
                //loop through template settings
                for (const setting of this.currentTemplateObject.config.userSettings) {
                    //assign values if names are matching
                    if (existingSetting.name === setting.name) {
                        setting.fileName = existingSetting.fileName;
                        setting.value = existingSetting.value;
                    }
                }
                if (existingSetting.name === '__taskThreadsAmount') {
                    this.taskThreadsAmount = existingSetting.value;
                }
            }
        } catch (e) {
            //do nothing
        }
    }

    sendTemplateSettings() {
        this.eventHook.reply('TaskManager', {
            type: 'set-template-config',
            config: this.currentTemplateObject.config,
            taskThreadsAmount: this.taskThreadsAmount
        })
    }

    async resetTemplateSettings(): Promise<void> {
        await this.selectTemplateFile();
        this.saveTemplateSettings();
        this.sendTemplateSettings();
    }

    getSettingsFilePath(): string {
        const slash = process.platform === 'win32' ? "\\" : '/';
        if (this.isDevelopmentEnv()) {
            return join(__dirname, `..${slash}..${slash}templates${slash}settings.json`);
        } else {
            return join(process.resourcesPath, `templates${slash}settings.json`)
        }
    }

    rmDirRecursive(path) {
        return new Promise(resolve => {
            fs.rm(path, {recursive: true}, () => { resolve(true); })
        })
    }

}

export default InternalAPI