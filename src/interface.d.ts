interface OpenSubmitterTemplateProtocol {
    config?: TemplateConfig,
    generateTasks: TemplateTaskGenerator,
    runTask: TemplateTaskRunner
}

type FileOpenDialogType = ('open' | 'save')
type TemplateTaskRunner = (task: TemplateTask) => Promise<any>;
type TemplateTaskGenerator = (...args: any) => Promise<TemplateTask[]>;
type TaskManagerInterfaceMode = ('settings' | 'running')

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

interface TaskStatusUpdate {
    status: string,
    completed: number,
    pending: number,
    updateLogMessage?: string
}