import UtilityProcess = Electron.UtilityProcess;

interface OpenSubmitterTemplateProtocol {
    config?: TemplateConfig,
    generateTasks: TemplateTaskGenerator,
    runTask: TemplateTaskRunner,
    log?: Function
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
    fileName?: string | null,
    required?: boolean,
    errorString?: string | null
}

interface TaskStatusUpdate {
    status: string,
    completed: number,
    pending: number,
    updateLogMessage?: string
}

interface TemplateControllerChild {
    child: UtilityProcess,
    textStatus: string
}

interface MessageWithType {
    type: string,
    data: object | any
}

interface TaskMessage {
    type: 'start-task',
    pid: number,
    task: TemplateTask,
    config: TemplateConfig | null
}