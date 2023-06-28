import puppeteer from 'puppeteer'
import { ipcMain } from 'electron'
import { join } from 'node:path'
const { dialog } = require('electron')
import ts, {ScriptTarget} from "typescript"
import fs from "fs"
import { join } from 'node:path'

class InternalAPI {

    currentTemplateClass = null;
    currentTemplateObject = null;

    startListening() {
        ipcMain.on('TM-select-template-dialog', async(e, data) => {
            await this.selectTemplateFile(e);
        });
        ipcMain.on('TM-run-opened-file', async(e, data) => {
            await this.runOpenedTemplate(e, data);
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

    async runOpenedTemplate(e, filename: string) {

        const browser = await puppeteer.launch(this.getPuppeteerOptions());
        console.log('creating new page ..');
        const page = await browser.newPage();

        try {
            const template = new this.currentTemplateClass.default();
            if (this.currentTemplateObject && this.currentTemplateObject.config) {
                template.config = this.currentTemplateObject.config;
            }

            //TODO: assign requested capabilities, like axios, puppeteer, anticaptcha
            template.page = page;
            const result = await template.run();
            console.log('result', result);

        } catch (e) {
            console.log('could not run template:', e.toString());
        }

        await browser.close();
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
            headless: true,
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