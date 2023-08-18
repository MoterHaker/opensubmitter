/// <reference path="type.d.ts" />
const fs = require("fs")

class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {

        // Name and description to display in OpenSubmitter's UI:
        name: 'Basic Template Example (puppeteer)',
        description: 'Open a websites with puppeteer-chromium in headless mode and write output to different files',

        // Based on this setting, OpenSubmitter will inject Puppeteer's page object into this template
        capabilities: ['puppeteer'],

        // This tells OpenSubmitter that the user is allowed to specify amount of threads:
        multiThreadingEnabled: true,

        // User's settings for OpenSubmitter UI:
        userSettings: [
            {
                // A text input with a button which opens "create a file" dialog
                type: 'OutputFile',
                name: 'outputFile',
                title: 'Where to write the output of the download',
                fileName: "",
                required: false,
                uiWidth: 100
            },{
                // Multi-lined text input with pre-filled value
                type: 'Textarea',
                name: 'websites',
                title: 'Websites list, one per line',
                value: 'https://www.google.com/\nhttps://www.github.com/\nhttps://www.bing.com/'
            }
        ],

        resultTableHeader: [
            {
                title: 'URL'
            },{
                title: 'Job result',
                isResult: true
            }
        ]
    };

    // Dummy variable, will be overridden by OpenSubmitter with Puppeteer's page object
    page = null;

    async generateTasks(...args: any): Promise<TemplateTask[]> {

        // "OutputFile" user settings value from the config above
        const fileName = this.config.userSettings.find(setting => setting.name === 'outputFile').fileName;

        // "Textarea" user settings value from the config
        const websiteValue = this.config.userSettings.find(setting => setting.name === 'websites').value;

        const websitesList = websiteValue.toString().split("\n")

        const result: TemplateTask[] = [];

        for (const website of websitesList) {
            if (/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(website)) {
                result.push({
                    data: {
                        url: website,

                        // If file path is specified, return file path + website address without special characters
                        // Otherwise have an empty fileName
                        fileName: fileName && fileName.length > 0 ?
                            (fileName + "." + website.replace(/[^a-zA-Z0-9]/g, '') + ".txt") :
                            null
                    }
                })
            }
        }

        return result;

    }


    async runTask(task: TemplateTask) {

        try {
            this.log(`navigating to ${task.data.url}...`);
            await this.page.goto(task.data.url, {
                waitUntil: "networkidle0",
                timeout: 5000
            });
            this.postResultToTable({
                'URL': task.data.url,
                'Job result': true
            })
        } catch (e) {
            this.log('err while loading the page: ' + e);
            this.postResultToTable({
                'URL': task.data.url,
                'Job result': false
            })
        }
        const result = await this.page.content();

        if (task.data.fileName) {
            fs.writeFileSync(task.data.fileName, result);
        }

    }

    // Returns custom Chromium arguments
    // This is a place to tune Chromium instance
    getPuppeteerArguments(): string[] {
        return [
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
    }

    // will be overridden by Template Controller
    postResultToTable(result: object) {

    }

    log(msg: string) {
        console.log(msg);
    }

}
