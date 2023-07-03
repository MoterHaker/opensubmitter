/// <reference path="../../src/interface.d.ts" />
import puppeteer, {Browser} from 'puppeteer'
import axios from 'axios';
import { ipcMain } from 'electron'
import { join } from 'node:path'
const { dialog } = require('electron')
import ts, {ScriptTarget} from "typescript"
import fs from "fs"

class InternalAPI {

    currentTemplateClass = null;
    currentTemplateObject?: OpenSubmitterTemplateProtocol | null = null;
    currentTasks: TemplateTask[] = [];
    isRunningAllowed = true;
    threads : TaskThread[] = [];
    maxTasks = 5; //TODO make an option

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
        const destinationPath = join(__dirname, "../compiled/compiled.mjs");
        try {
            fs.mkdirSync(join(__dirname, "../compiled"))
            if (fs.existsSync(destinationPath)) {
                fs.unlinkSync(destinationPath)
            }
        } catch (e) {
        }

        const files: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({ properties: ['openFile'] });
        if (!files || files.canceled) {
            console.log('canceled file opening')
            return;
        }

        const filename = files.filePaths[0];
        let contentJS = null;
        try {
            const contentTS = fs.readFileSync(filename).toString();
            contentJS = this.tsCompile(contentTS);
            fs.writeFileSync(destinationPath, contentJS);
            this.currentTemplateClass = await import(join(__dirname, "../compiled/compiled.mjs?"+Math.random())); //prevent from caching
            this.currentTemplateObject = new this.currentTemplateClass.default();
        } catch (e) {
            console.error(`could not compile ts file ${filename}: `, e.toString());
            event.reply('TaskManager', {type: 'set-template-name-error', error: "Invalid Typescript template"})
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
                running: 0,
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
                running: this.threads.length,
                pending: this.currentTasks.length
            }
        })

        let completedTasks = 0;
        console.log('iterating', this.currentTasks);
        while (true) {

            if (!this.isRunningAllowed) {
                break; //TODO terminate objects
            }

            // for (const thread of this.threads) {
            //     if (typeof thread.templateResult !== "Promise") {
            //
            //     }
            // }

            if (this.threads.length > this.maxTasks) {
                console.log('too many threads already running');
                await this.delay(500);
                continue;
            }

            const task = this.getTask();
            if (!task) {
                if (this.threads.length > 0) {
                    console.log('some threads are still running', this.threads.length)
                    await this.delay(1000);
                    continue;
                } else {
                    break;
                }
            }

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
            const id = Math.floor(Math.random()*100000000);
            this.threads.push({
                templateObject: template,
                templateResult: template.runTask(task).then(() => {
                    console.log(`thread ${id} finished`)
                    console.log('closing browser');
                    //closing browser object
                    if (template.browser) template.browser.close();
                    this.threads = this.threads.filter(thread => {
                        if (thread.id !== id) {
                            return true;
                        } else {
                            delete thread.templateObject;
                            thread = null;
                        }
                    })

                    completedTasks++;

                    event.reply('TaskManager', {
                        type: 'set-running-status',
                        statusData: {
                            status: 'Running tasks',
                            completed: completedTasks,
                            running: this.threads.length,
                            pending: this.currentTasks.length
                        }
                    })
                }),
                id: id,
                textStatus: "starting"
            })






        }

        event.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Job complete',
                completed: completedTasks,
                running: this.threads.length,
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

    delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
    }
}

export default InternalAPI