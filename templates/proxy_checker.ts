/// <reference path="../src/interfaces-template.d.ts" />

export default class Template implements OpenSubmitterTemplateProtocol {

    axios = null;

    config: TemplateConfig = {
        name: 'Proxy Checker Mofo',
        email: 'author@email.com',
        multiThreadingEnabled: true,
        rewardTronAddress: 'TPNnu4Wc5dUtpVt5dpQce32WnTrd4P5555',
        capabilities: ['axios'],
        userSettings: [
            {
                type: 'SourceFileTaskPerLine',
                title: 'Proxy List',
                required: true
            },{
                type: 'OutputFile',
                title: 'Check Results',
                required: true
            }
        ]
    };

    async generateTasks(...args: any): Promise<TemplateTask[]> {
        return []
    }

    async runTask(task: TemplateTask) {

    }

}
