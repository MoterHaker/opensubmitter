/// <reference path="type.d.ts" />
const fs = require("fs")

/**
 * Template
 */

class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {
        // name: 'Name removed',
        description: 'This template is for testing template validation',
        capabilities: ['puppeteer'],
        multiThreadingEnabled: true,
        something: [
            {
                type: 'OutputFile',
                name: 'outputFile',
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
        return true;
    }

    log(msg: string) {
        console.log('bad template says: '+msg);
    }

}
