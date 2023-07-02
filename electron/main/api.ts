/// <reference path="../../src/interface.d.ts" />
import puppeteer, {Browser} from 'puppeteer'
import axios from 'axios';
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
    isRunningAllowed = true;
    compiledTemplateFilePath = null;

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

        let controllerPath = join(__dirname, '../../dist/child.js');
        if (process.env && process.env.NODE_ENV && process.env.NODE_ENV === "development") {
            controllerPath = join(__dirname, '../../public/child.js');
        }
        const thepath = join(__dirname, '../../public/child.js');
        console.log('thepath: ' + thepath);
        try {
            const child = utilityProcess
                .fork(controllerPath)
                .on("spawn", () => {
                    console.log("spawned new utilityProcess")
                    child.postMessage('message')
                })
                .on('message', (data) => {
                    console.log('got message from child', data)
                    event.reply('TaskManager', {
                        type: 'set-running-status',
                        statusData: {
                            status: 'got message from child: '+ data,
                            completed: 0,
                            pending: 0
                        }
                    })
                })
                .on("exit", (code) => console.log("exiting utilityProcess"));

        } catch (e) {
            console.log('utility process failed: ', e.toString());
        }

        return;

        // const ch = getChildTemplate();
        let templateChildPath = '../../dist/templateChild.ts';
        if (process.env && process.env.NODE_ENV && process.env.NODE_ENV === "development") {
            templateChildPath = '../../public/templateChild.ts';
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


        console.log('contentJS', contentJS);

        try {
            fs.writeFileSync(this.compiledTemplateFilePath+".mjs", contentJS);
            fs.writeFileSync(this.compiledTemplateFilePath+".js", contentJS);
        } catch (e) {
            event.reply('TaskManager', {type: 'set-template-name-error', error: "Could not write compiled code to file "+this.compiledTemplateFilePath})
            return;
        }

        try {

            this.currentTemplateClass = await import(this.compiledTemplateFilePath+".mjs");
            this.currentTemplateObject = new this.currentTemplateClass.default();

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

    async runOpenedTemplate(event) {

        // const cont = fs.readFileSync(join(__dirname, "../../dist/emptytemplate.ts")).toString();
        // console.log(cont);
        // event.reply('TaskManager', {
        //     type: 'set-running-status',
        //     statusData: {
        //         status: cont,
        //         completed: 0,
        //         pending: 0
        //     }
        // })
        // return;

        console.log('running..')
        this.isRunningAllowed = true;
        const template: OpenSubmitterTemplateProtocol = new this.currentTemplateClass.default();
        if (this.currentTemplateObject && this.currentTemplateObject.config) {
            template.config = this.currentTemplateObject.config;
        }

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Generating tasks',
                completed: 0,
                pending: 0
            }
        })
        console.log('generating')
        this.currentTasks = await template.generateTasks();


        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Running tasks',
                completed: 0,
                pending: this.currentTasks.length
            }
        })

        let completedTasks = 0;
        // console.log('iterating', this.currentTasks);
        while (true) {

            if (!this.isRunningAllowed) {
                break;
            }
            const task = this.getTask();
            if (!task) break;

            try {
                const child = utilityProcess
                    .fork(this.compiledTemplateFilePath+".js")
                    .on("spawn", () => {
                        console.log("spawned new utilityProcess")
                        child.postMessage('message')
                    })
                    .on("exit", (code) => console.log("exiting utilityProcess"));

            } catch (e) {
                console.log('utility process failed: ', e.toString());
            }
            return;

            let browser: Browser | null = null;

            //creating template object
            const template = new this.currentTemplateClass.default();

            //setting configuration
            if (this.currentTemplateObject && this.currentTemplateObject.config) {
                template.config = this.currentTemplateObject.config;
            }

            //setting modules
            if (template.config && template.config.capabilities) {
                for (const capability of template.config.capabilities) {

                    switch (capability) {
                        case 'axios':
                            template.axios = axios;
                            break;

                        case 'puppeteer':
                            console.log('setting puppeteer');
                            // @ts-ignore
                            browser = await puppeteer.launch(this.getPuppeteerOptions());
                            template.page = await browser.newPage();
                            break;
                    }

                }
            }

            //running one task
            console.log('running task', task);
            await template.runTask(task)
            completedTasks++;

            event.reply('TaskManager', {
                type: 'set-running-status',
                statusData: {
                    status: 'Running tasks',
                    completed: completedTasks,
                    pending: this.currentTasks.length
                }
            })
            console.log('closing browser');
            //closing browser object
            if (browser) browser.close();

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

    private getPuppeteerOptions() {
        return {
            headless: 'new',
            ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
            devtools: false,
            args: [
                // `--proxy-server=${proxyAddress}:${proxyPort}`,
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--allow-running-insecure-content',
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--mute-audio',
                '--no-zygote',
                '--no-xshm',
                '--window-size=1920,1080',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--enable-webgl',
                '--ignore-certificate-errors',
                '--lang=en-US,en;q=0.9',
                '--password-store=basic',
                '--disable-gpu-sandbox',
                '--disable-software-rasterizer',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-infobars',
                '--disable-breakpad',
                '--disable-canvas-aa',
                '--disable-2d-canvas-clip-aa',
                '--disable-gl-drawing-for-tests',
                '--enable-low-end-device-mode',
                '--no-sandbox'
            ]
        };
    }
}

export default InternalAPI