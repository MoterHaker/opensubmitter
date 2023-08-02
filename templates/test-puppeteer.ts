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
            },{
                type: 'Checkbox',
                name: 'is_headless',
                title: 'Use headless mode',
                value: "true",
                uiWidth: 50,
            },{
                type: 'Radio',
                name: 'proxy_type',
                title: 'Use a proxy',
                selectableOptions: [
                    {
                        title: "No proxy, direct connection",
                        value: "direct"
                    },{
                        title: "Use a proxy",
                        value: "proxy",
                        selected: true
                    }
                ],
                uiWidth: 50
            },{
                type: 'Select',
                name: 'user_agent',
                title: 'Browser user-agent',
                value: 'default',
                selectableOptions: [
                    {
                        title: 'Default',
                        value: 'default'
                    },{
                        title: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
                        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15'
                    },{
                        title: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
                        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
                    }
                ],
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

    log(msg: string) {
        console.log('bro says: '+msg);
    }

}
