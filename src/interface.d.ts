interface OpenSubmitterTemplateProtocol {
    config?: TemplateConfig,
    generateTasks: TemplateTaskGenerator,
    runTask: TemplateTaskRunner
}

type TemplateTaskRunner = (task: TemplateTask) => Promise<any>;
type TemplateTaskGenerator = (...args: any) => Promise<TemplateTask[]>;

interface TemplateTask {
    data: any
}

interface TemplateConfig {
    name: string,
    capabilities?: [string],
    userSettings: Array<UserSetting>;
}

type UserSettingsInput = ('OutputFile' | 'SourceFileTaskPerLine')

interface UserSetting {
    type: UserSettingsInput,
    title: string,
    fileName?: string,
    required?: boolean
}