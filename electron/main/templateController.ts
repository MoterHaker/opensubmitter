/// <reference path="../../templates/type.d.ts" />
import Template from "./emptytemplate";
import {Browser} from "puppeteer";

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
    extraFemaleNames: string[] = [];
    extraMaleNames: string[] = [];
    extraSurnames: string[] = [];
    protected antiCaptchaAPIKey: string = null;
    protected IMAPConnection: IMAPModule | null;

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

    async solveCaptcha(captcha: Captcha): Promise<string | object> {
        const ac = require("@antiadmin/anticaptchaofficial");
        ac.setAPIKey(this.antiCaptchaAPIKey);
        ac.settings.softId = 1118;
        if (this.config.rewardTronAddress && this.config.rewardTronAddress.length > 0) {
            ac.settings.OSTronAddress = this.config.rewardTronAddress;
        }
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

    async getIMAPMessages(config): Promise<any[]> {
        const simpleParser = require('mailparser').simpleParser;
        const imapsimple = require('imap-simple');

        this.log('opening an IMAP connection');
        this.IMAPConnection = null;
        try {
            this.IMAPConnection = await imapsimple.connect(config);
        } catch (e) {
            this.log('could not open connection '+(e as String).toString());
            return null;
        }

        this.log('opening mail INBOX')
        await this.IMAPConnection.openBox('INBOX');

        this.log('getting list of messages from INBOX')
        const messages = await this.IMAPConnection.search(['ALL'], { bodies: [''], struct: true });

        const result = [];

        for (const message of messages) {

            const allParts = message.parts.find(part => part.which === "");

            const mail = await simpleParser(allParts.body);
            mail["UID"] = message.attributes.uid;
            if (mail.from) {
                mail["fromFull"] = mail.from;
                mail["from"] = mail.from.text;
            }
            if (mail.to) {
                mail["toFull"] = mail.to;
                mail["to"] = mail.to.text;
            }

            if (mail.html) mail["body"] = mail.textAsHtml;
            else mail["body"] = mail.text;
            result.push(mail);

        }

        this.log(`downloaded ${result.length} IMAP messages`)

        return result;
    }

    async deleteIMAPMessage(uid: number): Promise<void> {
        await this.IMAPConnection.deleteMessage([uid])
    }

    getPuppeteerArguments(): string[] {
        return super.getPuppeteerArguments();
    }

    override getRandomName(requirements: GeneratedPersonRequirements): GeneratedPerson {

        console.log('this.electronAssetsDirectory', this.electronAssetsDirectory);
        if (this.extraFemaleNames.length === 0) {
            const fs = require("fs");
            const path = require("path");
            this.extraMaleNames = fs.readFileSync(path.join(this.electronAssetsDirectory, 'males.txt')).toString().toLowerCase().split("\n");
            this.extraFemaleNames = fs.readFileSync(path.join(this.electronAssetsDirectory, 'females.txt')).toString().toLowerCase().split("\n");
            this.extraSurnames = fs.readFileSync(path.join(this.electronAssetsDirectory, 'surnames.txt')).toString().toLowerCase().split("\n");
        }

        let isMale = true;
        if (requirements.randomGender === true) {
            isMale = Math.random() > 0.5
        }

        return {
            name: this.capitalizeFirst(isMale ? this.extraMaleNames[Math.floor(Math.random()*this.extraMaleNames.length)] :
                           this.extraFemaleNames[Math.floor(Math.random()*this.extraFemaleNames.length)]),
            surname: this.capitalizeFirst(this.extraSurnames[Math.floor(Math.random()*this.extraSurnames.length)]),
            username: this.generateUserName(typeof requirements.minimumUsernameLength !== "undefined" ? requirements.minimumUsernameLength : 10,
                                typeof requirements.usernameWithANumber !== "undefined" ? requirements.usernameWithANumber : true),
            password: this.generatePassword(true, true)
        }

    }

    generatePassword(withSpecial: boolean, withNumbers: boolean): string {
        const letters = 'qwertyuiopasdfghjklzxcvbnm1234567890';
        const upper = 'QWERTYUIOPASDFGHJKLZXCVBNM';
        const numbers = '1234567890';
        const result = [];
        for (let i = 0; i<12;i++) {
            result.push(letters[Math.floor(Math.random()*letters.length)]);
        }
        if (withSpecial) {
            const special = '@!#%_-';
            for (let i = 0; i < 5; i++) {
                result.push(special[Math.floor(Math.random() * special.length)]);
            }
        }
        for (let i = 0; i<5;i++) {
            result.push(upper[Math.floor(Math.random()*upper.length)]);
        }
        if (withNumbers) {
            for (let i = 0; i<5;i++) {
                result.push(numbers[Math.floor(Math.random()*numbers.length)]);
            }
        }
        return (this.shuffleArray(result) as string[]).join("");
    }

    generateUserName(length: number, withNumbers: boolean) {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];

        let result = '';
        let currentIsVowel = Math.random() < 0.5; // Randomly determine if we start with a vowel

        for (let i = 0; i < length; i++) {
            const currentList = currentIsVowel ? vowels : consonants;
            const randomIndex = Math.floor(Math.random() * currentList.length);
            result += currentList[randomIndex];

            currentIsVowel = !currentIsVowel; // Switch between vowel and consonant
        }
        if (withNumbers) {
            const numbersLength = Math.floor(Math.random() * 3) + 1;
            const numbers = '1234567890';
            for (let i = 0; i<numbersLength;i++) {
                result += numbers[Math.floor(Math.random()*numbers.length)];
            }
        }

        return result;
    }

    capitalizeFirst(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    shuffleArray(array: any[]): any[] {
        for (let i = array.length - 1; i > 0; i--) {
            // Generate a random index between 0 and i (inclusive)
            const j = Math.floor(Math.random() * (i + 1));

            // Swap elements at indices i and j
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

}

(async() => {
    let child = new TemplateController();
    await child.startMessaging();
})();

module.exports = { TemplateController }



