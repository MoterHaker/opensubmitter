/// <reference path="../../templates/type.d.ts" />

export default class Template implements OpenSubmitterTemplateProtocol {

    config = null

    async generateTasks(...args: any): Promise<TemplateTask[]> {
        return []
    }


    async runTask(task: TemplateTask) {

    }

    postResultToTable(result: object) {

    }

    getPuppeteerArguments(): string[] {
        return []
    }

    log(message) {

    }
}