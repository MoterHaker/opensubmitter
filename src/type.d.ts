import UtilityProcess = Electron.UtilityProcess;

type TaskManagerInterfaceMode = ('settings' | 'running')

interface TaskStatusUpdate {
    status: string,
    completed: number,
    pending: number,
    active: number,
    updateLogMessage?: string
}

interface TemplateControllerChild {
    child: UtilityProcess,
    threadNumber: number,
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
    config: TemplateConfig | null,
    antiCaptchaAPIKey: string,
    puppeteerHeadOn: boolean,
    electronAssetsDirectory: string,
    latestSharedData: any
}
interface ThreadStatus {
    thread: number,
    status: string
}

interface AppSettings {
    antiCaptchaAPIKey?: string
}

interface RunTemplateParameters {
    type: ('run-opened-file'),
    threadsNumber: number,
    puppeteerHeadOn: boolean,
    settings: any
}

type ExportFormat = ( 'CSV' | 'SQL' | 'JSON' | 'MongoDB' )