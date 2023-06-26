import puppeteer from 'puppeteer'
import { join } from 'node:path'
const { dialog } = require('electron')

class InternalAPI {

    async hello(e, message: Object) {

        e.reply('nice', 'path: '+__dirname)
        const files = await dialog.showOpenDialog({ properties: ['openFile'] });

        if (!files || files.canceled) {
            e.reply('nice', 'canceled opening');
            return;
        }
        console.log(files);

        // console.log('iapi hello:', message);


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
            let templatePath = 'bropanel.mjs';
            const time = Math.random();
            const templateObject = await import(files.filePaths[0]+'?'+time);
            // console.log("type:", typeof templateObject);
            // const { obj } = templateObject;
            // console.log('obj', obj);
            const template = new templateObject.default(page);
            // console.log(template);
            template.page = page;
            const result = await template.run();
            e.reply('nice', result)

        } catch (e) {
            console.log('could not run:', e.toString());
            e.reply('nice', 'could not run:', e.toString())
        }

        // try {
        //     await page.goto('https://bropanel.com/', {
        //         waitUntil: "networkidle0",
        //         timeout: 20000
        //     });
        // } catch (e) {
        //     console.log('err while loading the page: ' + e);
        // }
        // console.log(await page.content());
        // Take screenshot
        await browser.close();
    }
}

export default InternalAPI