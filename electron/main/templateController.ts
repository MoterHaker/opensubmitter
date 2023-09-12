/// <reference path="../../templates/type.d.ts" />
import Template from "./emptytemplate";
import {Browser} from "puppeteer";
import {app} from "electron";

// contents of these are going to be inserted directly above "cut"
const IMAPSimpler = require('./template-submodules/imap');
const Anticaptcha = require('./template-submodules/anticaptcha');
const NamesGenerator = require('./template-submodules/names-generator');

// below this "cut" the contents of the file will be added to a template contents and compiled together
// imports above are just for IDE reference

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
    electronAssetsDirectory: string;
    protected antiCaptchaAPIKey: string = null;

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
                    const taskMessage: TaskMessage = message;
                    if (taskMessage.latestSharedData) {
                        this.receiveBroadcastMessage(taskMessage.latestSharedData);
                    }
                    await this.startTask(taskMessage);
                    break;

                case 'receive-broadcast-data':
                    this.receiveBroadcastMessage(message.data);
                    break;
            }
        })
    }

    async startTask(message: TaskMessage) {
        this.myPID = message.pid;
        this.task = message.task;
        this.config = message.config
        this.antiCaptchaAPIKey = message.antiCaptchaAPIKey;
        this.electronAssetsDirectory = message.electronAssetsDirectory;

        //setting modules
        if (this.config && this.config.capabilities) {
            for (const capability of this.config.capabilities) {

                switch (capability) {
                    case 'axios':
                        this.axios = require('axios');
                        break;

                    case 'puppeteer':
                        try {
                            this.puppeteer = await import("puppeteer");
                        } catch (e) {
                            this.log("could not import puppeteer: "+e.toString())
                            return;
                        }
                        this.log('launching puppeteer browser');
                        this.browser = await this.puppeteer.launch(this.getPuppeteerOptions(message.puppeteerHeadOn));
                        this.page = await this.browser.newPage();
                        break;
                }

            }
        }

        try {
            await this.runTask(this.task);

            //adding small delay to allow all messages to be posted
            await this.delay(100);
        } catch (e) {
            this.log('Template execution error: '+e.toString());
        }
        process.exit();
    }

    override log(message: string) {
        if (typeof super.log === "function") {
            super.log(message);
        }
        this.messageToParent('log-update', { message }, false)
    }

    override postResultToTable(result: object) {
        if (!this.config.resultTableHeader) {
            return;
        }
        const fillResults = Object.assign({}, this.config.resultTableHeader);
        const postResult: ResultTableRow[] = [];
        Object.keys(fillResults).forEach(key => {
            const title = fillResults[key].title;

            //find matching property
            const matchingProperty = Object.entries(result).find(([resultKey, resultValue]) => resultKey === title);
            fillResults[key]['value'] = matchingProperty[1];
            postResult.push({
                title,
                value: matchingProperty[1],
                isResult: fillResults[key].isResult,
                nowrap: fillResults[key].nowrap
            } as ResultTableRow)
        });

        this.messageToParent('post-result-to-table', postResult)

    }

    private messageToParent(type: string, data: object, delay: boolean = true) {

        // small delay to prevent message overdose at the main process
        let delayTime = 0;
        if (delay) {
            delayTime = 50 + Math.floor(Math.random()*50)
        }

        setTimeout(() => {
            if (!this.parentPort) return;
            this.parentPort.postMessage({
                type,
                data,
                pid: this.myPID
            })
        }, delayTime);
    }

    private getPuppeteerOptions(puppeteerHeadOn: boolean) {

        let puppeteerArguments = [
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
        ];

        if (typeof this.getPuppeteerArguments !== "undefined") {
            this.log('using template\'s puppeteer arguments')
            puppeteerArguments = this.getPuppeteerArguments();
        } else {
            this.log('using default puppeteer arguments');
        }

        return {
            headless: puppeteerHeadOn ? false : 'new',
            executablePath: this.puppeteerExecutablePath,
            ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
            devtools: false,
            args: puppeteerArguments
        };
    }

    delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
    }

    getPuppeteerArguments(): string[] {
        return super.getPuppeteerArguments();
    }

    postResultToStorage(result: TemplateResult) {
        this.messageToParent('save-results-to-storage', result);
    }

    broadcastMessageToThreads(data: any) {
        this.messageToParent('broadcast-message-to-threads', data, false);
    }

    receiveBroadcastMessage(data: any) {
        if (typeof super.receiveBroadcastMessage !== "function") return;
        super.receiveBroadcastMessage(data);
    }

}


function applyMixins(derivedCtor: any, baseCtors: any[]) {
    const skipProperties = [
        'constructor',
        'log',
        'config'
    ];
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            if (skipProperties.indexOf(name) === -1) {
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            }
        });
    });
}

(async() => {
    applyMixins(TemplateController, [IMAPSimpler, Anticaptcha, NamesGenerator])
    let child = new TemplateController();
    await child.startMessaging();
})();

module.exports = { TemplateController }



