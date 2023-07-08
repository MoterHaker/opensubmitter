/// <reference path="../../src/interfaces-template.d.ts" />
/// <reference path="../../src/interfaces-app.d.ts" />
import {app, ipcMain} from 'electron'
import { join } from 'node:path'
const { dialog } = require('electron')
import ts, {ScriptTarget} from "typescript"
import { utilityProcess } from "electron";
import fs from "fs"
import {tmpdir} from 'os';


class InternalAPI {

    currentTemplateClass = null;
    currentTemplateObject?: OpenSubmitterTemplateProtocol | null = null;
    currentTasks: TemplateTask[] = [];
    threads: TemplateControllerChild[] = [];
    isRunningAllowed = true;
    compiledTemplateFilePath = null;
    taskThreadsAmount = 2; //TODO make an option
    eventHook = null;
    puppeteerExecutablePath = null;
    asarExtractedDirectory = null;
    previousFullModulesPath = null;
    freedThreadNumbers: number[] = [];

    startListening() {
        ipcMain.on('TM', async(e, data) => {
            if (!data.type) return;
            switch (data.type) {

                case 'select-template-dialog':
                    await this.selectTemplateFile(e);
                    break;

                case 'run-opened-file':
                    await this.runOpenedTemplate(e);
                    break;

                case 'select-file-for-template-settings':
                    await this.selectFileForTemplateSettings(e, data);
                    break;

                case 'stop-job':
                    //TODO: terminate threads
                    this.isRunningAllowed = false;
                    this.moveAsarModulesBack();
                    break;

            }

        });
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
            config: this.currentTemplateObject.config
        })
    }


    async selectTemplateFile(event) {

        this.eventHook = event;

        const slash = process.platform === 'win32' ? "\\" : '/';

        let templateChildPath = null;
        if (this.isDevelopmentEnv()) {
            templateChildPath = join(__dirname, `..${slash}..${slash}electron${slash}main${slash}templateController.ts`);
        } else {
            templateChildPath = join(process.resourcesPath, `src${slash}templateController.ts`)
        }
        let templateChildContent = fs.readFileSync(templateChildPath).toString();
        templateChildContent = templateChildContent.split("//cut")[1];

        const files: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({ properties: ['openFile'] });
        if (!files || files.canceled) {
            console.log('canceled file opening')
            return;
        }

        const filename = files.filePaths[0];


        this.compiledTemplateFilePath = tmpdir() + `${slash}compiled`+Math.random();
        this.asarExtractedDirectory = tmpdir() + `${slash}opensubmitter-asar`;

        fs.mkdirSync(this.compiledTemplateFilePath);

        console.log('temporary dir: ' + this.compiledTemplateFilePath);

        this.putFakeModuleReplacements();
        this.definePuppeteerExecutablePath();


        let contentJS = null;
        let contentTS = null;

        try {
            contentTS = fs.readFileSync(filename).toString();
        } catch (e) {
            event.reply('TaskManager', {type: 'set-template-name-error', error: "Could not open "+filename})
            return;
        }

        contentTS = contentTS + templateChildContent;

        try {
            contentJS = this.tsCompile(contentTS);
        } catch (e) {
            event.reply('TaskManager', {type: 'set-template-name-error', error: "Could not compile TypeScript to Javascript"})
            return;
        }

        //setting puppeteer executable path
        contentJS = contentJS.replace('%PUPPETEER_EXECUTABLE_PATH%', this.puppeteerExecutablePath);

        try {
            fs.writeFileSync(`${this.compiledTemplateFilePath}${slash}index.cjs`, contentJS);
        } catch (e) {
            event.repnply('TaskManager', {type: 'set-template-name-error', error: "Could not write compiled code to file "+this.compiledTemplateFilePath})
            return;
        }


        try {

            let importPath = `${this.compiledTemplateFilePath}/index.cjs`;
            console.log('platform '+process.platform);
            if (process.platform === 'win32') {
                importPath = `file:///${this.compiledTemplateFilePath}/index.cjs`.replace('\\', '/');
            }
            console.log('importing from '+importPath)
            const { TemplateController } = await import(importPath);
            this.currentTemplateObject = new TemplateController();

        } catch (e) {
            console.error(`could not open mjs file ${this.compiledTemplateFilePath}: `, e.toString());
            event.reply('TaskManager', {type: 'set-template-name-error', error: `Could not import script from template ${this.compiledTemplateFilePath}${slash}index.cjs`})
            return;
        }

        event.reply('TaskManager', { type: 'set-template-name', filename })
        event.reply('TaskManager', { type: 'set-template-name-error', error: "" })

        if (!this.currentTemplateObject.config) {
            console.log('no config in the template')
            return;
        }

        event.reply('TaskManager', {
            type: 'set-template-config',
            config: this.currentTemplateObject.config
        })
    }

    async childMessageHandler(child: UtilityProcess, message: MessageWithType) {
        console.log("message from child: ", message);
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

    postThreadStatuses() {
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

    printThreadsStatuses() {
        for (const thread of this.threads) {
            console.log(`thread #${thread.threadNumber}, PID ${thread.child.pid} status: ${thread.textStatus}`)
        }
        console.log("\n\n");
    }

    addToParentLog(message) {
        console.log(message);
        this.eventHook.reply('TaskManager', {
            type: 'add-log-message',
            message: message
        })
    }

    async runOpenedTemplate(event) {

        this.eventHook = event;
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
        this.currentTasks = await this.currentTemplateObject.generateTasks();
        console.log('this.currentTasks ' + JSON.stringify(this.currentTasks));

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Running tasks',
                completed: 0,
                pending: this.currentTasks.length
            }
        })

        let completedTasks = 0;
        let threadQueueNumber = 1;


        while (true) {

            if (!this.isRunningAllowed) {
                //todo kill threads
                break;
            }

            this.postThreadStatuses();


            if (this.threads.length >= this.taskThreadsAmount) {
                console.log('reached threads limit')
                await this.delay(1000);
                continue;
            }

            const task = this.getTask();
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
                    .fork(this.compiledTemplateFilePath + "/index.cjs")
                    .on("spawn", () => {
                        console.log("spawned new utilityProcess " + child.pid)
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
                        console.log("exiting utilityProcess pid " + child.pid)
                        completedTasks++;
                        event.reply('TaskManager', {
                            type: 'set-running-status',
                            statusData: {
                                status: 'Running tasks',
                                completed: completedTasks,
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

            } catch (e) {
                this.addToParentLog("Could not start thread process: "+e.toString())
            }

        }

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Job complete',
                completed: completedTasks,
                pending: this.currentTasks.length
            }
        })

        console.log('Removing temporary directory with compiled script');
        this.moveAsarModulesBack();
        fs.rmdirSync(this.compiledTemplateFilePath, { recursive: true });
        this.addToParentLog(`Done! Completed ${completedTasks} tasks`);
    }

    getTask(): TemplateTask | null {
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

    delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
    }

    isDevelopmentEnv() {
        return process.env && process.env.NODE_ENV && process.env.NODE_ENV === "development";
    }

    /**
     * Put empty axios and puppeteer modules into temporary directory instead of
     * copying the whole node_modules or extracting app.arar file.
     * User might change his mind and choose another template, so we extract real
     * node_modules just before the template start.
     */
    putFakeModuleReplacements() {
        const slash = process.platform === 'win32' ? "\\" : '/';
        fs.mkdirSync(`${this.compiledTemplateFilePath}${slash}node_modules`);
        fs.mkdirSync(`${this.compiledTemplateFilePath}${slash}node_modules${slash}axios`);
        fs.mkdirSync(`${this.compiledTemplateFilePath}${slash}node_modules${slash}puppeteer`);
        fs.writeFileSync(`${this.compiledTemplateFilePath}${slash}node_modules${slash}axios${slash}index.js`,"module.export={}");
        fs.writeFileSync(`${this.compiledTemplateFilePath}${slash}node_modules${slash}puppeteer${slash}index.js`,"module.export={}");
    }

    async extractNodeModules() {

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
            const targetModulesPath = this.compiledTemplateFilePath + `${slash}node_modules`;

            if (fs.existsSync(targetModulesPath)) {
                console.log('removing fake dir', targetModulesPath);
                fs.rmdirSync(targetModulesPath, {recursive: true});
            }
            console.log('moving', fullModulesPath, 'to', targetModulesPath);
            fs.renameSync(fullModulesPath, targetModulesPath)

            return true;
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
                            "targetModulesPath":join(this.compiledTemplateFilePath + `${slash}node_modules`)
                        })
                    })
                    .on("exit", (code) => {
                        resolve(code)
                    });
            })
            return true;

        }
        console.log('node_modules prepared');
    }

    definePuppeteerExecutablePath() {
        let executablePath = '';
        const slash = process.platform === 'win32' ? "\\" : '/';
        if (process.platform === 'darwin' && process.arch === 'arm64') {
            executablePath = 'mac_arm-114.0.5735.133/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome';
        }
        if (process.platform === 'win32') {
            executablePath = 'win64-114.0.5735.133\\chrome-win64\\chrome.exe';
        }
        //TODO add more platforms

        if (!this.isDevelopmentEnv()) {
            this.puppeteerExecutablePath = `${this.asarExtractedDirectory}${slash}dist${slash}puppeteer${slash}${executablePath}`;
        } else {
            this.puppeteerExecutablePath = join(app.getAppPath(), `${slash}public${slash}puppeteer${slash}${executablePath}`);

        }
        if (process.platform === 'win32') {
            //making double quotes so it could work in the template variable %PUPPETEER_EXECUTABLE_PATH%
            this.puppeteerExecutablePath = this.puppeteerExecutablePath.replace(/\\/g, "\\\\");
        }
        console.log('this.puppeteerExecutablePath: '+this.puppeteerExecutablePath);

    }

    moveAsarModulesBack() {
        if (this.asarExtractedDirectory && !this.isDevelopmentEnv()) {
            const slash = process.platform === 'win32' ? "\\" : '/';
            const fullModulesPath = `${this.asarExtractedDirectory}${slash}dist${slash}bundled-node-modules${slash}modules`;
            const targetModulesPath = this.compiledTemplateFilePath + `${slash}node_modules`;
            if (!fs.existsSync(targetModulesPath)) {
                console.log('moveAsarDirectoryBack: targetModulesPath does not exist: ',targetModulesPath);
                return;
            }
            fs.renameSync(targetModulesPath, fullModulesPath);
            console.log('moved modules back from', targetModulesPath, 'to', fullModulesPath);
        }
    }

}

export default InternalAPI