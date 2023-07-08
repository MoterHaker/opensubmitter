/// <reference path="../src/interfaces-template.d.ts" />
const fs = require("fs")

class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {
        name: 'Template tester from MotaHaker (puppeteer)',
        capabilities: ['puppeteer'],
        multiThreadingEnabled: true,
        userSettings: [
            {
                type: 'OutputFile',
                title: 'Where to write the output of the download',
                fileName: "",
                required: false
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
