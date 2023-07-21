/// <reference path="../../templates/type.d.ts" />
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

                    await this.startTask(message);
                    break;
            }
        })
    }

    async startTask(message: TaskMessage) {
        this.myPID = message.pid;
        this.task = message.task;
        this.config = message.config
        this.antiCaptchaAPIKey = message.antiCaptchaAPIKey;

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
                        this.browser = await this.puppeteer.launch(this.getPuppeteerOptions());
                        this.page = await this.browser.newPage();
                        break;
                }

            }
        }

        try {
            await this.runTask(this.task);
        } catch (e) {
            this.log('Template execution error: '+e.toString());
        }
        process.exit();
    }

    override log(message: string) {
        super.log(message);
        this.messageToParent('log-update', { message })
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

    async solveCaptcha(captcha: Captcha): Promise<string | object> {
        const ac = require("@antiadmin/anticaptchaofficial");
        ac.setAPIKey(this.antiCaptchaAPIKey);
        ac.settings.softId = 1118;
        switch (captcha.type) {
            case 'image':
                if (!captcha.imageBodyBase64) {
                    throw new Error("Captcha body not set");
                }
                return await ac.solveImage(captcha.imageBodyBase64, true)

            case 'RecaptchaV2':
                if (captcha.extraParameters && captcha.extraParameters.recaptchaDataSValue) {
                    ac.settings.recaptchaDataSValue = captcha.extraParameters.recaptchaDataSValue;
                }
                if (!captcha.websiteURL || !captcha.websiteKey) {
                    throw new Error("Missing required captcha parameters");
                }

                if (this.isProxyParamsValid(captcha)) {
                    return await ac.solveRecaptchaV2ProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        captcha.extraParameters?.userAgent,
                        '',
                        typeof captcha.extraParameters?.isInvisible !== "undefined" ? captcha.extraParameters?.isInvisible : null);
                }

                return await ac.solveRecaptchaV2Proxyless(
                    captcha.websiteURL,
                    captcha.websiteKey,
                    typeof captcha.extraParameters?.isInvisible !== "undefined" ? captcha.extraParameters?.isInvisible : null);

            case 'RecaptchaV3':
                if (!captcha.websiteURL || !captcha.websiteKey || !captcha.extraParameters.v3score) {
                    throw new Error("Missing required captcha parameters");
                }
                return await ac.solveRecaptchaV3(
                    captcha.websiteURL,
                    captcha.websiteKey,
                    captcha.extraParameters.v3score,
                    captcha.extraParameters?.pageAction);

            case 'HCaptcha':
                if (!captcha.websiteURL || !captcha.websiteKey) {
                    throw new Error("Missing required captcha parameters");
                }
                let token;
                if (this.isProxyParamsValid(captcha)) {
                    token = await ac.solveHCaptchaProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        null, // UA is not required
                        '',
                        captcha.extraParameters?.enterprisePayload,
                        typeof captcha.extraParameters?.isInvisible !== "undefined" ? captcha.extraParameters?.isInvisible : null);
                } else {
                    token = await ac.solveHCaptchaProxyless(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        null, // UA is not required
                        captcha.extraParameters?.enterprisePayload,
                        typeof captcha.extraParameters?.isInvisible !== "undefined" ? captcha.extraParameters?.isInvisible : null);
                }
                const userAgent = ac.getHcaptchaUserAgent(); // UA is taken from the solving worker
                return {
                    token,
                    userAgent
                }

            case 'FunCaptcha':
                if (!captcha.websiteURL || !captcha.websiteKey) {
                    throw new Error("Missing required captcha parameters");
                }
                if (captcha.extraParameters && captcha.extraParameters.APISubdomain) {
                    ac.settings.funcaptchaApiJSSubdomain = captcha.extraParameters.APISubdomain;
                }
                if (captcha.extraParameters && captcha.extraParameters.APISubdomain) {
                    ac.settings.funcaptchaDataBlob = captcha.extraParameters.funcaptchaDataBlob;
                }

                if (this.isProxyParamsValid(captcha)) {
                    return await ac.solveFunCaptchaProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        captcha.extraParameters?.userAgent,
                        '');
                }

                return await ac.solveFunCaptchaProxyless(
                    captcha.websiteURL,
                    captcha.websiteKey);

            case 'Geetest3':
                if (!captcha.websiteURL ||
                    !captcha.websiteKey ||
                    !captcha.extraParameters.geetestChallenge) {
                    throw new Error("Missing required captcha parameters");
                }
                if (this.isProxyParamsValid(captcha)) {
                    return await ac.solveFunCaptchaProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.extraParameters.geetestChallenge,
                        captcha.extraParameters?.APISubdomain,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        captcha.extraParameters?.userAgent,
                        '');
                }
                return await ac.solveGeeTestProxyless(
                    captcha.websiteURL,
                    captcha.websiteKey,
                    captcha.extraParameters.geetestChallenge,
                    captcha.extraParameters?.APISubdomain);

            case 'Geetest4':
                if (!captcha.websiteURL ||
                    !captcha.websiteKey) {
                    throw new Error("Missing required captcha parameters");
                }
                if (this.isProxyParamsValid(captcha)) {
                    return await ac.solveGeeTestV4ProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.extraParameters?.APISubdomain,
                        captcha.extraParameters?.geetest4InitParameters,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        captcha.extraParameters?.userAgent,
                        '');
                }
                return await ac.solveGeeTestV4Proxyless(
                    captcha.websiteURL,
                    captcha.websiteKey,
                    captcha.extraParameters?.APISubdomain,
                    captcha.extraParameters?.geetest4InitParameters);
                break;

            case 'Turnstile':
                if (!captcha.websiteURL ||
                    !captcha.websiteKey) {
                    throw new Error("Missing required captcha parameters");
                }
                if (this.isProxyParamsValid(captcha)) {
                    return await ac.solveTurnstileProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        captcha.extraParameters?.pageAction);
                }
                return await ac.solveGeeTestV4Proxyless(
                    captcha.websiteURL,
                    captcha.websiteKey,
                    captcha.extraParameters?.pageAction);
                break;

        }
        throw new Error("Unsupported captcha type")
    }

    isProxyParamsValid(captcha: Captcha) {
        if (!captcha.proxyAddress || !captcha.proxyPort || !captcha.proxyType) return false;
        if (captcha.proxyPort < 80) return false;
        if (captcha.proxyAddress.split(".").length !== 4) return false;
        return true;
    }

}

(async() => {
    let child = new TemplateController();
    await child.startMessaging();
})();

module.exports = { TemplateController }



