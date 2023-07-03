/// <reference path="../../src/interface.d.ts" />
import axios from "axios";
import puppeteer from "puppeteer";
import { ipcMain } from 'electron'
import { join } from 'node:path'
import path from 'path'
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

        let templateChildPath = '../../dist/templateController.ts';
        if (process.env && process.env.NODE_ENV && process.env.NODE_ENV === "development") {
            templateChildPath = '../../public/templateController.ts';
        }
        let templateChildContent = fs.readFileSync(join(__dirname, templateChildPath)).toString();
        templateChildContent = templateChildContent.split("//cut")[1];

        const files: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({ properties: ['openFile'] });
        if (!files || files.canceled) {
            console.log('canceled file opening')
            return;
        }

        const filename = files.filePaths[0];
        this.compiledTemplateFilePath = tmpdir() + "/compiled"+Math.random();
        fs.mkdirSync(this.compiledTemplateFilePath);
        fs.writeFileSync(this.compiledTemplateFilePath + "/package.json", JSON.stringify({
            "type":"commonjs",
            "exports": "./index.js"
        }))

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


        // console.log('contentJS', contentJS);

        try {
            // fs.writeFileSync(this.compiledTemplateFilePath+"/index.mjs", contentJS);
            fs.writeFileSync(this.compiledTemplateFilePath+"/index.js", contentJS);
        } catch (e) {
            event.reply('TaskManager', {type: 'set-template-name-error', error: "Could not write compiled code to file "+this.compiledTemplateFilePath})
            return;
        }




        try {

            const { TemplateController } = require(this.compiledTemplateFilePath+"/index.js");
            this.currentTemplateObject = new TemplateController();

        } catch (e) {
            console.error(`could not open mjs file ${this.compiledTemplateFilePath}: `, e.toString());
            event.reply('TaskManager', {type: 'set-template-name-error', error: "Invalid Typescript template (could not import from "+this.compiledTemplateFilePath+")"})
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

    async runOpenedTemplate(event) {

        console.log('running..')
        this.isRunningAllowed = true;
        // const template: OpenSubmitterTemplateProtocol = new this.currentTemplateClass.default();
        // if (this.currentTemplateObject && this.currentTemplateObject.config) {
        //     template.config = this.currentTemplateObject.config;
        // }

        await puppeteer.launch();

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Generating tasks',
                completed: 0,
                pending: 0
            }
        })
        console.log('generating');
        this.currentTasks = await this.currentTemplateObject.generateTasks();
        console.log('this.currentTasks', this.currentTasks);

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Running tasks',
                completed: 0,
                pending: this.currentTasks.length
            }
        })

        let completedTasks = 0;


        while (true) {

            if (!this.isRunningAllowed) {
                //todo kill threads
                break;
            }


            if (this.threads.length >= this.taskThreadsAmount) {
                console.log('reached threads limit')
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
                    console.log('all threads are finished')
                    break;
                }
            }

            console.log('running task', task);

            const child = utilityProcess
                .fork(this.compiledTemplateFilePath+"/index.js")
                .on("spawn", () => {
                    console.log("spawned new utilityProcess "+child.pid)
                    child.postMessage({
                        'type': "start-task",
                        "pid": child.pid,
                        "task": task,
                        "config": this.currentTemplateObject.config ? this.currentTemplateObject.config : null
                    } as TaskMessage)
                })
                .on('message', async(data) => {
                    await this.childMessageHandler(child, data)
                })
                .on("exit", (code) => {
                    this.threads = this.threads.filter(thread => thread.child.pid !== child.pid);
                    console.log("exiting utilityProcess pid "+child.pid)
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

        }

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Job complete',
                completed: completedTasks,
                pending: this.currentTasks.length
            }
        })
        console.log('done!, completed: '+completedTasks);
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
}

export default InternalAPI