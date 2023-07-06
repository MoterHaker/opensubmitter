/// <reference path="../../src/interface.d.ts" />
import Template from "./emptytemplate";
import {Browser} from "puppeteer";
//cut


class TemplateController extends Template {

    myPID: number = 0;
    puppeteer = null;
    parentPort = null;
    page = null;
    browser: Browser | null = null;
    axios = null;
    task = null;
    puppeteerExecutablePath = '%PUPPETEER_EXECUTABLE_PATH%';

    async startMessaging() {
        if (!process || typeof process.parentPort === "undefined") {
            return;
        }




        this.parentPort = process.parentPort;
        this.parentPort.on('message', async(e) => {
            const message = e.data;
            if (typeof message.type === "undefined") return;

            //messages from parent (main) process
            switch (message.type) {
                case 'start-task':
                    //todo: Import only if has puppeteer option
                    this.log("importing puppeteer")
                    try {
                        this.puppeteer = await import("puppeteer");
                    } catch (e) {
                        this.log("could not import puppeteer: "+e.toString())
                        return;
                    }

                    await this.startTask(message);
                    break;
            }
        })
    }

    async startTask(message: TaskMessage) {
        this.myPID = message.pid;
        this.task = message.task;
        this.config = message.config

        //setting modules
        if (this.config && this.config.capabilities) {
            for (const capability of this.config.capabilities) {

                switch (capability) {
                    case 'axios':
                        this.axios = require('axios');
                        break;

                    case 'puppeteer':
                        this.log('launching puppeteer');
                        this.browser = await this.puppeteer.launch(this.getPuppeteerOptions());
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

        let executablePath = '';



        return {
            headless: 'new',
            executablePath: this.puppeteerExecutablePath,
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

module.exports = { TemplateController }



