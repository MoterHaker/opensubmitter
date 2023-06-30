/// <reference path="../src/interface.d.ts" />
import * as fs from "node:fs";


export default class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {
        name: 'Template tester from MotaHaker',
        capabilities: ['puppeteer'],
        userSettings: [
            {
                type: 'OutputFile',
                title: 'Where to write the output of the download',
                fileName: "",
                required: true
            }
        ]
    };

    page = null;

    async generateTasks(...args: any): Promise<TemplateTask[]> {
        return [{
            data: null // return one empty task to iterate once
        },{
            data: null // return one empty task to iterate once
        }]
    }


    async runTask(task: TemplateTask) {
        try {
            console.log('navigating...');
            await this.page.goto('https://antigate.com/iptest.php', {
                waitUntil: "networkidle0",
                timeout: 20000
            });
        } catch (e) {
            console.log('err while loading the page: ' + e);
        }
        const result = await this.page.content();
        if (this.config.userSettings[0].fileName.length > 0) {
            fs.writeFileSync(this.config.userSettings[0].fileName, result);
        } else {
            console.log('no filename is specified!');
        }
        console.log('done');
        return result;
    }

}
