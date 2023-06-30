import puppeteer, {Browser} from 'puppeteer'
import axios from 'axios';
import { ipcMain } from 'electron'
import { join } from 'node:path'
const { dialog } = require('electron')
import ts, {ScriptTarget} from "typescript"
import fs from "fs"
import { join } from 'node:path'
import * as interfaces from "../src/interface.d.ts"

class InternalAPI {

    currentTemplateClass = null;
    currentTemplateObject?: OpenSubmitterTemplateProtocol | null = null;
    currentTasks: TemplateTask[] = [];

    startListening() {
        ipcMain.on('TM-select-template-dialog', async(e, data) => {
            await this.selectTemplateFile(e);
        });
        ipcMain.on('TM-run-opened-file', async(e) => {
            await this.runOpenedTemplate(e);
        });
        ipcMain.on('TM-select-file-for-template-settings', async(e, data) => {
            await this.selectFileForTemplateSettings(e, data);
        });
    }

    async selectFileForTemplateSettings(e, data) {
        if (data.type === 'open') {
            const files: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({properties: ['openFile']});
            if (!files || files.canceled) {
                return;
            } else {
                this.currentTemplateObject.config.userSettings[data.index]["fileName"] = files.filePaths[0];
            }
        }
        if (data.type === 'save') {
            const files: Electron.SaveDialogReturnValue = await dialog.showSaveDialog({properties: ['showOverwriteConfirmation']});
            if (!files || files.canceled) {
                return;
            } else {
                this.currentTemplateObject.config.userSettings[data.index]["fileName"] = files.filePath;
            }
        }
        e.reply('TM-set-template-config', this.currentTemplateObject.config)
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
            event.reply('TM-set-template-name-error', "Invalid Typescript template")
            return;
        }

        event.reply('TM-set-template-name', filename)
        event.reply('TM-set-template-name-error', "")

        if (!this.currentTemplateObject.config) {
            return;
        }

        if (this.currentTemplateObject.config) {
            event.reply('TM-set-template-config', this.currentTemplateObject.config)
        }
    }

    async runOpenedTemplate(event) {

        console.log('running..')
        const template = new this.currentTemplateClass.default();
        if (this.currentTemplateObject && this.currentTemplateObject.config) {
            template.config = this.currentTemplateObject.config;
        }

        event.reply('TM-set-running-status', {
            status: 'Generating tasks',
            completed: 0,
            pending: 0
        })
        console.log('generating')
        this.currentTasks = await template.generateTasks();


        event.reply('TM-set-running-status', {
            status: 'Running tasks',
            completed: 0,
            pending: this.currentTasks.length
        })

        let completedTasks = 0;
        console.log('iterating', this.currentTasks);
        for (const index in this.currentTasks) {

            console.log('running', index);
            let browser: Browser | null = null;

            //creating template object
            const template: OpenSubmitterTemplateProtocol = new this.currentTemplateClass.default();

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
                            browser = await puppeteer.launch(this.getPuppeteerOptions());
                            template.page = await browser.newPage();
                            break;
                    }

                }
            }

            //running one task
            console.log('running task', this.currentTasks.length[index]);
            await template.runTask(this.currentTasks.length[index])
            completedTasks++;

            event.reply('TM-set-running-status', {
                status: 'Running tasks',
                completed: completedTasks,
                pending: this.currentTasks.length
            })
            console.log('closing browser');
            //closing browser object
            if (browser) browser.close();

        }
        console.log('done!');
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
            headless: "new",
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