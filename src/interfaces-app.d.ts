import UtilityProcess = Electron.UtilityProcess;

type TaskManagerInterfaceMode = ('settings' | 'running')

interface TaskStatusUpdate {
    status: string,
    completed: number,
    pending: number,
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
    config: TemplateConfig | null
}
interface ThreadStatus {
    thread: number,
    status: string
}