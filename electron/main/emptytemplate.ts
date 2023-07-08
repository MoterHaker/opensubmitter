/// <reference path="../../src/interfaces-template.d.ts" />

export default class Template implements OpenSubmitterTemplateProtocol {

    config = null

    async generateTasks(...args: any): Promise<TemplateTask[]> {
        return []
    }


    async runTask(task: TemplateTask) {

    }

    log(message) {

    }
}