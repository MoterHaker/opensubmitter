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

    getRandomName(requirements: GeneratedPersonRequirements): GeneratedPerson {
        return {
            name: '',
            surname: '',
            username: '',
            password: ''
        }
    }

    log(message) {

    }
}