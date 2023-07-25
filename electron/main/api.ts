/// <reference path="../../templates/type.d.ts" />
/// <reference path="../../src/type.d.ts" />
import {app, ipcMain} from 'electron'
import { join } from 'node:path'
const { dialog } = require('electron')
import ts, {ScriptTarget} from "typescript"
import { utilityProcess } from "electron";
import fs from "fs"
import os, {tmpdir} from 'os';
import ac from "@antiadmin/anticaptchaofficial"
import axios from "axios";
import {pathsConfig} from "./pathsconfig";


class InternalAPI {

    currentTemplateClass = null;
    currentTemplateObject?: OpenSubmitterTemplateProtocol | null = null;
    templateSettingsWereSaved: bool = false;
    currentTasks: TemplateTask[] = [];
    threads: TemplateControllerChild[] = [];
    isRunningAllowed = true;
    compiledTemplateFilePath = null;
    selectedTemplateFilePath = null;
    taskThreadsAmount = 10;
    eventHook = null;
    freedThreadNumbers: number[] = [];
    areModulesExtracted = false;
    modulesVersion = '0002';
    protected savedSettings: AppSettings = {};

    protected paths = pathsConfig();

    // A list to exclude templates from auto-scanning in production mode
    excludeTemplatesFromProduction = [
        'bad-template.ts', //should not even appear in the list
        'test-puppeteer.ts',
        'test-axios.ts'
    ];

    startListening(): void {
        this.readSettings();
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
                    break;

                case 'read-local-templates':
                    await this.readLocalTemplates();
                    break;

                case 'reset-template-settings':
                    await this.resetTemplateSettings();
                    break;

                case 'save-settings':
                    await this.saveAppSettings(data);
                    break;

                case 'get-settings':
                    this.readSettings();
                    break;

                case 'download-template':
                    await this.downloadTemplate(data.id)
                    break;



            }

        });
        this.extractNodeModules();
    }

    async downloadTemplate(id: number): Promise<void> {

        const templatePath = `${this.paths.templatesDirectory}${this.paths.slash}${id}.ts`;
        try {
            const result = await axios.post('https://opensubmitter.com/api/template/download', {
                id,
                env: 'prod'
            }, {
                    headers: {
                        Accept: 'Accept: application/json'
                    }
                }
            )
            fs.writeFileSync(templatePath, result.data.contents);
            await this.readLocalTemplates();
            await this.eventHook.reply('TaskManager', {
                type: 'switch-to-loaded-template',
                path: `${this.paths.slash}${id}.ts`
            })

        } catch (e) {
            console.error('Could not download template: '+e.toString());
            return;
        }
    }

    async readLocalTemplates(): Promise<void> {

        //reading parent template controller contents
        const templateParentContent = fs.readFileSync(this.paths.templateControllerPath).toString().split("//cut")[1];
        
        //listing templates directory
        const templatesList = fs.readdirSync(this.paths.templatesDirectory, {withFileTypes: true})
                                .filter(item => {
                                    if (item.isDirectory()) return false;
                                    if (!this.isDevelopmentEnv() && this.excludeTemplatesFromProduction.indexOf(item.name) !== -1) { console.log('excludingng', item); return false };
                                    let ext = item.name.substring(item.name.indexOf('.')+1);
                                    return ['ts','js'].indexOf(ext) !== -1;
                                })
                                .map(item => item.name)

        //temporary dir for compiled templates
        if (!fs.existsSync(this.paths.temporaryCompiledTemplatesDirectory)) fs.mkdirSync(this.paths.temporaryCompiledTemplatesDirectory);
        if (!fs.existsSync(this.paths.temporaryCompiledTemplatesNodeModules)) {
            fs.mkdirSync(this.paths.temporaryCompiledTemplatesNodeModules)
            fs.mkdirSync(join(this.paths.temporaryCompiledTemplatesNodeModules, 'axios'))
            fs.mkdirSync(join(this.paths.temporaryCompiledTemplatesNodeModules, 'puppeteer'))
            fs.writeFileSync(join(this.paths.temporaryCompiledTemplatesNodeModules, 'axios', 'index.js'),"module.export={}");
            fs.writeFileSync(join(this.paths.temporaryCompiledTemplatesNodeModules, 'puppeteer', 'index.js'),"module.export={}");
        }

        const result: LocalTemplateListItem[] = [];
        for (const templateFile of templatesList) {
            const templatePath = join(this.paths.templatesDirectory, templateFile);
            let compiledPath = join(this.paths.temporaryCompiledTemplatesDirectory, `${templateFile}.cjs`);

            //combined Typescript contents of template and its parent controller
            const contentTS = fs.readFileSync(templatePath).toString() + templateParentContent;

            let contentJS;
            try {

                //compiling TS into JS, saving into .cjs file
                contentJS = this.tsCompile(contentTS);
                fs.writeFileSync(compiledPath, contentJS);

                //win32 has it's own importing trick
                if (process.platform === 'win32') {
                    compiledPath = `file:///${compiledPath}`.replace('\\', '/');
                }

                //importing compiled module
                const { TemplateController } = await import(compiledPath);
                //creating new template object and getting configuration
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

        if (!this.selectedTemplateFilePath) return;

        const slash = process.platform === 'win32' ? "\\" : '/';

        //defining the path for compiled template
        this.compiledTemplateFilePath = join(this.paths.compiledTemplateDir, `index${Math.random()}.cjs`)


        let contentJS = null;
        let contentTS = null;

        try {
            contentTS = fs.readFileSync(this.selectedTemplateFilePath).toString();
        } catch (e) {
            this.eventHook.reply('TaskManager', {type: 'set-template-name-error', error: "Could not open "+this.selectedTemplateFilePath})
            return;
        }

        //merging together template contents with parent controller
        contentTS = contentTS + this.paths.templateControllerContent;

        try {
            //compiling them into JavaScript
            contentJS = this.tsCompile(contentTS);
        } catch (e) {
            this.eventHook.reply('TaskManager', {type: 'set-template-name-error', error: "Could not compile TypeScript to Javascript"})
            return;
        }

        //setting puppeteer executable path in the parent template controller
        contentJS = contentJS.replace('%PUPPETEER_EXECUTABLE_PATH%', this.paths.puppeteerExecutablePath());

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

        if (!this.validateTemplateObject()) return;

        //responding to UI with file name and no errors status
        this.eventHook.reply('TaskManager', { type: 'set-template-name', filename: this.selectedTemplateFilePath })
        this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "" })

        if (!this.currentTemplateObject.config) {
            console.log('no config in the template')
            return;
        }
    }

    validateTemplateObject(): boolean {
        const pleaseRefer = ". Please refer to our documentation at https://opensubmitter.com/documentation";
        if (!this.currentTemplateObject.config) {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template does not have config property"+pleaseRefer })
            return false;
        }
        if (!this.currentTemplateObject.config.name) {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template does not have config.name property"+pleaseRefer })
            return false;
        }
        if (typeof this.currentTemplateObject.config.name !== "string") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's property config.name is of incorrect type"+pleaseRefer })
            return false;
        }
        if (!this.currentTemplateObject.config.description) {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template does not have config.description property"+pleaseRefer })
            return false;
        }
        if (typeof this.currentTemplateObject.config.description !== "string") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's property config.description is of incorrect type"+pleaseRefer })
            return false;
        }
        if (typeof this.currentTemplateObject.config.multiThreadingEnabled === "undefined") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template does not have config.multiThreadingEnabled property"+pleaseRefer })
            return false;
        }
        if (typeof this.currentTemplateObject.config.multiThreadingEnabled !== "boolean") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's property config.multiThreadingEnabled is of incorrect type"+pleaseRefer })
            return false;
        }
        if (!this.currentTemplateObject.config.userSettings) {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template does not have config.userSettings property"+pleaseRefer })
            return false;
        }
        if (typeof this.currentTemplateObject.config.userSettings !== "object") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's property config.userSettings is of incorrect type"+pleaseRefer })
            return false;
        }
        if (typeof this.currentTemplateObject.generateTasks !== "function") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's generateTasks function is missing"+pleaseRefer })
            return false;
        }
        if (typeof this.currentTemplateObject.runTask !== "function") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's runTask function is missing"+pleaseRefer })
            return false;
        }
        return true;
    }

    async childMessageHandler(child: UtilityProcess, message: MessageWithType): Promise<void> {
        for (const thread of this.threads) {
            if (thread.child.pid === child.pid) {

                switch (message.type) {
                    case 'log-update':
                        thread.textStatus = message.data.message;
                        this.eventHook.reply('TaskManager', {
                            type: 'add-log-message',
                            message: 'Thread '+thread.threadNumber + ": " + message.data.message
                        })
                        break;

                    case 'post-result-to-table':
                        this.eventHook.reply('TaskManager', {
                            type: 'post-result-to-table',
                            result: message.data
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

        if (!await this.checkIfModulesAreExtracted()) {
            return;
        }

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
        // console.log('this.currentTasks ' + JSON.stringify(this.currentTasks));

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
                            "config": this.currentTemplateObject.config ? this.currentTemplateObject.config : null,
                            "antiCaptchaAPIKey": this.savedSettings.antiCaptchaAPIKey
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
                    // console.log(`got newThreadNumber from threadQueueNumber, newThreadNumber = ${newThreadNumber}, threadQueueNumber = ${threadQueueNumber}`)
                } else {
                    // console.log('popped from freedThreadNumbers: ', newThreadNumber)
                }

                // console.log('adding thread with number ',newThreadNumber)

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
     * Extract node_modules, move to a temporary directory where compiled templates will be run from.
     * Doing all this in a separate thread in asarextractor.js to offload the main process.
     */
    async extractNodeModules(): Promise<void> {

        //checking if modules have the latest version already
        if (fs.existsSync(this.paths.compiledTemplateNodeModules) && fs.existsSync(this.paths.compiledTemplateNodeModulesVersion)) {
            const version = fs.readFileSync(this.paths.compiledTemplateNodeModulesVersion).toString();
            if (version === this.modulesVersion) {
                console.log('node_modules version is matching, skipping new copying');
                this.areModulesExtracted = true;
                return;
            }
        }

        if (!this.isDevelopmentEnv()) {

            //extracting app.asar if not extracted yet
            if (!fs.existsSync(this.paths.asarExtractedNodeModules)){

                await new Promise((resolve, reject) => {
                    const child = utilityProcess
                        .fork(this.paths.extractor)
                        .on("spawn", () => {
                            child.postMessage({
                                'type': "prepare-production",
                                "asarExtractedDirectory": this.paths.asarExtractedDirectory,
                                "appPath": app.getAppPath(),
                                "fullModulesPath": this.paths.asarExtractedNodeModules,
                                "targetModulesPath": this.paths.compiledTemplateNodeModules
                            })
                        })
                        .on("exit", (code) => {
                            resolve(code)
                        });
                })
            }

        } else {

            // Developer mode
            // Copying files from local extra/bundled-node-modules/modules

            await new Promise((resolve, reject) => {
                const child = utilityProcess
                    .fork(this.paths.extractor)
                    .on("spawn", () => {
                        child.postMessage({
                            'type': "prepare-development",
                            "sourceModulesPath": this.paths.developmentNodeModules,
                            "targetModulesPath": this.paths.compiledTemplateNodeModules
                        })
                    })
                    .on("exit", (code) => {
                        resolve(code)
                    });
            })

        }
        fs.writeFileSync(this.paths.compiledTemplateNodeModulesVersion, this.modulesVersion);
        this.areModulesExtracted = true;
        console.log('node_modules and browsers are prepared');
    }

    async checkIfModulesAreExtracted() {
        for (let wait = 0;wait < 120; wait++) {
            if (!this.areModulesExtracted) {
                this.eventHook.reply('TaskManager', {
                    type: 'set-running-status',
                    statusData: {
                        status: 'Preparing modules',
                        completed: 0,
                        pending: 0
                    }
                })
                console.log('wating modules extraction..', wait)
                await this.delay(500);
            } else {
                break;
            }
            if (wait == 119) {
                this.eventHook.reply('TaskManager', {
                    type: 'set-running-status',
                    statusData: {
                        status: 'Failed to copy modules. Too slow computer?',
                        completed: 0,
                        pending: 0
                    }
                })
                return false;
            }
        }
        return true;
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
        if (fs.existsSync(this.paths.settingsFile)) {
            try {
                config = JSON.parse(fs.readFileSync(this.paths.settingsFile).toString())
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
        fs.writeFileSync(this.paths.settingsFile, JSON.stringify(config, null, 2)); //save with pretty-printing
    }

    loadTemplateSettings(): void {
        this.templateSettingsWereSaved = false;
        if (!this.currentTemplateObject.config || !this.currentTemplateObject.config.userSettings) return; //non-existing config
        if (!fs.existsSync(this.paths.settingsFile)) return;
        try {
            const config = JSON.parse(fs.readFileSync(this.paths.settingsFile).toString());
            if (typeof config[this.currentTemplateObject.config.name] === "undefined") return;

            //loop through saved settings
            for (const existingSetting of config[this.currentTemplateObject.config.name]) {
                //loop through template settings
                for (const setting of this.currentTemplateObject.config.userSettings) {
                    //assign values if names are matching
                    if (existingSetting.name === setting.name) {

                        setting.fileName = existingSetting.fileName;
                        setting.value = existingSetting.value;

                        if (existingSetting.fileName && existingSetting.fileName.length > 0) {
                            this.templateSettingsWereSaved = true;
                        }
                        if (existingSetting.value && existingSetting.value.length > 0) {
                            this.templateSettingsWereSaved = true;
                        }
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
            taskThreadsAmount: this.taskThreadsAmount,
            settingsWereSaved: this.templateSettingsWereSaved ? this.templateSettingsWereSaved : null
        })
    }

    async resetTemplateSettings(): Promise<void> {
        await this.selectTemplateFile();
        this.saveTemplateSettings();
        this.templateSettingsWereSaved = false;
        this.sendTemplateSettings();
    }

    rmDirRecursive(path) {
        return new Promise(resolve => {
            fs.rm(path, {recursive: true}, () => { resolve(true); })
        })
    }

    readSettings() {
        if (!fs.existsSync(this.paths.settingsFile)) return;
        try {
            const config = JSON.parse(fs.readFileSync(this.paths.settingsFile).toString());
            if (typeof config["___settings"] === "undefined") return;
            this.savedSettings = config["___settings"];
            if (this.eventHook) {
                this.eventHook.reply('Settings', {
                    type: 'set-settings',
                    settings: this.savedSettings
                })
            }
        } catch (e) {
            //do nothing
        }
    }

    async saveAppSettings(data) {
        const ac = require("@antiadmin/anticaptchaofficial");
        ac.setAPIKey(data.antiCaptchaAPIKey);
        try {
            const balance = await ac.getBalance();
            this.eventHook.reply('Settings', {
                type: 'set-balance-value',
                balance
            })
            this.savedSettings["antiCaptchaAPIKey"] = data.antiCaptchaAPIKey;
            this.saveSettingsFile();
        } catch (e) {
            this.eventHook.reply('Settings', {
                type: 'set-key-error'
            })
            console.log("got error: ", e.toString());
        }
    }

    saveSettingsFile() {
        let config = {};
        if (fs.existsSync(this.paths.settingsFile)) {
            try {
                config = JSON.parse(fs.readFileSync(this.paths.settingsFile).toString())
            } catch (e) {
                //default empty config
            }
        }
        config["___settings"] = this.savedSettings;
        fs.writeFileSync(this.paths.settingsFile, JSON.stringify(config, null, 2)); //save with pretty-printing
    }

}

export default InternalAPI