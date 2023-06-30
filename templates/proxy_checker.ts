/// <reference path="../src/interface.d.ts" />

export default class Template implements OpenSubmitterTemplateProtocol {

    axios = null;

    config: TemplateConfig = {
        name: 'Proxy Checker from MotaHaker',
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
