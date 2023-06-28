import puppeteer from 'puppeteer'
import { ipcMain } from 'electron'
import { join } from 'node:path'
const { dialog } = require('electron')

class InternalAPI {

    startListening() {
        ipcMain.on('TM-select-template-dialog', this.selectTemplateFile);
        ipcMain.on('TM-run-opened-file', this.runOpenedTemplate);
    }

    async selectTemplateFile(e) {
        console.log('selecting template file')
        const files = await dialog.showOpenDialog({ properties: ['openFile'] });
        if (!files || files.canceled) {
            return;
        }
        e.reply('TM-set-file-name', files.filePaths[0])
    }

    async runOpenedTemplate(e, filename: string) {


        let options = {
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
        const browser = await puppeteer.launch(options);
        console.log('creating new page ..');
        const page = await browser.newPage();

        try {
            const time = Math.random();
            const templateObject = await import(filename+'?'+time);
            const template = new templateObject.default();
            template.page = page;
            const result = await template.run();
            console.log('result', result);

        } catch (e) {
            console.log('could not run template:', e.toString());
        }

        await browser.close();
    }
}

export default InternalAPI