/// <reference path="../../src/interface.d.ts" />
import axios from "axios";
import puppeteer from "puppeteer";
import {app, ipcMain} from 'electron'
import { join } from 'node:path'
import path from 'path'
const { dialog } = require('electron')
import ts, {ScriptTarget} from "typescript"
import { utilityProcess } from "electron";
import fs from "fs"
import {tmpdir} from 'os';
import asar, {extractAll} from "@electron/asar";


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

        let templateChildPath = `..${slash}..${slash}dist${slash}templateController.ts`;
        if (this.isDevelopmentEnv()) {
            templateChildPath = `..${slash}..${slash}public${slash}templateController.ts`;
        }
        let templateChildContent = fs.readFileSync(join(__dirname, templateChildPath)).toString();
        templateChildContent = templateChildContent.split("//cut")[1];

        const files: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({ properties: ['openFile'] });
        if (!files || files.canceled) {
            console.log('canceled file opening')
            return;
        }

        const filename = files.filePaths[0];
        this.compiledTemplateFilePath = tmpdir() + `${slash}compiled`+Math.random();
        fs.mkdirSync(this.compiledTemplateFilePath);

        this.addToParentLog('temporary dir: ' + this.compiledTemplateFilePath);


        this.extractNodeModules();
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
            this.addToParentLog('platform '+process.platform);
            if (process.platform === 'win32') {
                importPath = `file:///${this.compiledTemplateFilePath}/index.cjs`.replace('\\', '/');
            }
            this.addToParentLog('importing from '+importPath)
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
                            message: child.pid + ": " + message.data.message
                        })
                        break;
                }

                return;
            }
        }
    }

    printThreadsStatuses() {
        for (const thread of this.threads) {
            console.log(`thread ${thread.child.pid} status: ${thread.textStatus}`)
        }
        console.log("\n\n");
    }

    addToParentLog(message) {
        this.eventHook.reply('TaskManager', {
            type: 'add-log-message',
            message: message
        })
    }

    async runOpenedTemplate(event) {

        this.eventHook = event;
        console.log('running..')

        this.isRunningAllowed = true;
        // const template: OpenSubmitterTemplateProtocol = new this.currentTemplateClass.default();
        // if (this.currentTemplateObject && this.currentTemplateObject.config) {
        //     template.config = this.currentTemplateObject.config;
        // }


        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Generating tasks',
                completed: 0,
                pending: 0
            }
        })
        this.addToParentLog('generating');
        this.currentTasks = await this.currentTemplateObject.generateTasks();
        this.addToParentLog('this.currentTasks ' + JSON.stringify(this.currentTasks));

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Running tasks',
                completed: 0,
                pending: this.currentTasks.length
            }
        })

        let completedTasks = 0;

        this.addToParentLog(this.compiledTemplateFilePath + "/index.cjs")

        while (true) {

            if (!this.isRunningAllowed) {
                //todo kill threads
                break;
            }


            if (this.threads.length >= this.taskThreadsAmount) {
                this.addToParentLog('reached threads limit')
                this.printThreadsStatuses();
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
                    this.addToParentLog('all threads are finished')
                    break;
                }
            }


            try {
                const child = utilityProcess
                    .fork(this.compiledTemplateFilePath + "/index.cjs")
                    .on("spawn", () => {
                        this.addToParentLog("spawned new utilityProcess " + child.pid)
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
                        this.threads = this.threads.filter(thread => thread.child.pid !== child.pid);
                        this.addToParentLog("exiting utilityProcess pid " + child.pid)
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

                this.threads.push({
                    child,
                    textStatus: "Started thread"
                })

            } catch (e) {
                this.addToParentLog("could not start child process: "+e.toString())
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

        this.addToParentLog('Removing temporary directory with compiled script');
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


    extractNodeModules() {

        const slash = process.platform === 'win32' ? "\\" : '/';


        if (!this.isDevelopmentEnv()) {

            // App is a build.
            // Extracting files from app.asar

            const asar = require('@electron/asar');
            this.asarExtractedDirectory = this.compiledTemplateFilePath + `${slash}asar`
            fs.mkdirSync(this.asarExtractedDirectory);
            this.addToParentLog('extracting to '+this.asarExtractedDirectory)
            asar.extractAll(app.getAppPath(), this.asarExtractedDirectory);
            try {
                const fullModulesPath = this.compiledTemplateFilePath + `${slash}asar${slash}dist${slash}bundled-node-modules${slash}modules`;
                const targetModulesPath = this.compiledTemplateFilePath + `${slash}node_modules`;
                this.addToParentLog('modules path: ' + fullModulesPath)
                this.addToParentLog('copying to ' + targetModulesPath)
                fs.cpSync(fullModulesPath, this.compiledTemplateFilePath + `${slash}node_modules`, {recursive: true});

            } catch (e) {
                this.addToParentLog('copy error: ' + e.toString())
                return;
            }
        } else {

            // Developer mode
            // Copying files from local public/bundled-node-modules/modules
            const sourceModulesPath = join(app.getAppPath()+`${slash}public${slash}bundled-node-modules${slash}modules`);
            const targetModulesPath = join(this.compiledTemplateFilePath + `${slash}node_modules`);
            console.log('source modules path', sourceModulesPath);
            console.log('target modules path', targetModulesPath);
            fs.cpSync(sourceModulesPath, targetModulesPath, {recursive: true});

        }
        this.addToParentLog('node_modules prepared');
    }

    definePuppeteerExecutablePath() {
        let executablePath = '';
        const slash = process.platform === 'win32' ? "\\\\" : '/';
        if (process.platform === 'darwin' && process.arch === 'arm64') {
            executablePath = 'mac_arm-114.0.5735.133/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome';
        }
        if (process.platform === 'win32') {
            executablePath = 'win64-114.0.5735.133\\\\chrome-win64\\\\chrome.exe';
        }
        //TODO add more platforms

        if (!this.isDevelopmentEnv()) {
            this.puppeteerExecutablePath = `${this.asarExtractedDirectory}${slash}dist${slash}puppeteer${slash}${executablePath}`;
        } else {
            this.puppeteerExecutablePath = app.getAppPath() + `${slash}public${slash}puppeteer${slash}${executablePath}`;
        }

    }

    removeAsarDirectory() {
        if (this.asarExtractedDirectory) {
            fs.rmdirSync(this.asarExtractedDirectory, {recursive: true})
        }
    }

}

export default InternalAPI