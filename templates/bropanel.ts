/// <reference path="../src/interface.d.ts" />
import * as fs from "node:fs";


export default class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {
        name: 'Template tester from MotaHaker',
        capabilities: ['puppeteer'],
        userSettings: [
            // {
            //     type: 'OutputFile',
            //     title: 'Where to write the output of the download',
            //     fileName: "",
            //     required: true
            // }
        ]
    };

    page = null;

    async generateTasks(...args: any): Promise<TemplateTask[]> {
        return [{
            data: 0 
        },{
            data: 1 
        },{
            data: 2 
        },{
            data: 3 
        },{
            data: 4 
        },{
            data: 5 
        },{
            data: 6 
        },{
            data: 7 
        },{
            data: 8 
        },{
            data: 9 
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
        if (this.config.userSettings && this.config.userSettings.length && this.config.userSettings[0].fileName && this.config.userSettings[0].fileName.length > 0) {
            fs.writeFileSync(this.config.userSettings[0].fileName, result);
        } else {
            console.log('no filename is specified!');
        }
        console.log('done');
        return result;
    }

}
