/// <reference path="type.d.ts" />
const fs = require("fs")

class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {
        name: 'Template tester from MoterHaker (puppeteer)',
        description: 'Open a website with puppeteer-chromium in headless mode',
        capabilities: ['puppeteer'],
        multiThreadingEnabled: true,
        userSettings: [
            {
                type: 'OutputFile',
                name: 'outputFile',
                title: 'Where to write the output of the download',
                fileName: "",
                required: false,
                uiWidth: 100
            }
        ]
    };

    //dummy variables, will be overridden by parent manager class
    page = null;

    async generateTasks(...args: any): Promise<TemplateTask[]> {
        return [{
            data: 0 // return one empty task to iterate once
        },{
            data: 1 // return one empty task to iterate once
        },{
            data: 2 // return one empty task to iterate once
        }]
    }


    async runTask(task: TemplateTask) {

        //this is how you set proxy authorization:
        await this.page.authenticate({
            username: "login",
            password: "password",
        });

        try {
            this.log('navigating...');
            await this.page.goto('https://antigate.com/iptest.php', {
                waitUntil: "networkidle0",
                timeout: 20000
            });
        } catch (e) {
            this.log('err while loading the page: ' + e);
        }
        const result = await this.page.content();
        if (result.indexOf('<ip>') !== -1) {
            this.log('IP: '+result.split("<ip>")[1].split("</ip>")[0]);
        } else {
            this.log('control phrase not found!');
        }
        if (this.config &&
            this.config.userSettings &&
            this.config.userSettings.length > 0 &&
            this.config.userSettings[0].fileName.length > 0) {
            fs.writeFileSync(this.config.userSettings[0].fileName, result);
        } else {
            this.log('no filename is specified!');
        }

        return result;
    }

    getPuppeteerArguments(): string[] {
        return [
            // `--proxy-server=1.2.3.4:8080`, //this is how you set a proxy
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

    log(msg: string) {
        console.log('bro says: '+msg);
    }

}
