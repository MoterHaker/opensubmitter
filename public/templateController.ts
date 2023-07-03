/// <reference path="../src/interface.d.ts" />
import Template from "./emptytemplate";
import {Browser} from "puppeteer";
//cut
// import puppeteer from '/Users/flash/Documents/work/opensubmitter/node_modules/puppeteer'
import puppeteer from '/Users/flash/Documents/work/opensubmitter/node_modules/puppeteer/lib/cjs/puppeteer/puppeteer.js'
import axios from '/Users/flash/Documents/work/opensubmitter/node_modules/axios/index.js'

interface ParentPort {
    postMessage: Function,
    on: Function
}
interface ChildProcess extends NodeJS.Process {
    parentPort: ParentPort
}

class TemplateController extends Template {

    myPID: number = 0;
    parentPort: ParentPort = null;
    page = null;
    browser: Browser | null = null;
    puppeteer = null;
    axios = null;
    task = null;

    async startMessaging() {
        if (!process || typeof (process as ChildProcess).parentPort === "undefined") {
            return;
        }
        this.parentPort = (process as ChildProcess).parentPort;
        this.parentPort.on('message', async(e) => {
            const message = e.data;
            if (typeof message.type === "undefined") return;

            //messages from parent (main) process
            switch (message.type) {
                case 'start-task':
                    await this.startTask(message);
                    break;
            }
        })
        // this.log('waiting 1 second');
        //
        // await this.delay(1000);
        // this.log('waiting another 3 seconds');
        //
        // await this.delay(3000);
        // this.log('exiting');
        // process.exit();
    }

    // statusUpdate(message: string) {
    //     this.messageToParent('status-update', { message })
    // }

    async startTask(message: TaskMessage) {
        this.myPID = message.pid;
        this.task = message.task;
        this.config = message.config

        //setting modules
        if (this.config && this.config.capabilities) {
            for (const capability of this.config.capabilities) {

                switch (capability) {
                    case 'axios':
                        this.axios = axios;
                        break;

                    case 'puppeteer':
                        this.log('launching puppeteer');
                        this.browser = await puppeteer.launch(this.getPuppeteerOptions());
                        this.page = await this.browser.newPage();
                        break;
                }

            }
        }

        this.log('starting task');
        await this.runTask(this.task);
        this.log('exiting thread');
        process.exit();
    }

    override log(message: string) {
        super.log(message);
        this.messageToParent('log-update', { message })
    }

    private messageToParent(type: string, data: object) {
        this.parentPort.postMessage({
            type,
            data,
            pid: this.myPID
        });
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

(async() => {
    let child = new TemplateController();
    await child.startMessaging();
})();

export default TemplateController
// module.exports = { TemplateController }



