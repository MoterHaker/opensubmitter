/// <reference path="../src/interface.d.ts" />

export default class Template implements OpenSubmitterTemplateProtocol {
    async generateTasks(...args: any): Promise<TemplateTask[]> {
        return []
    }


    async runTask(task: TemplateTask) {

    }
}