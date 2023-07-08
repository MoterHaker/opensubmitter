
interface OpenSubmitterTemplateProtocol {
    config?: TemplateConfig,
    generateTasks: TemplateTaskGenerator,
    runTask: TemplateTaskRunner,
    log?: Function
}

type FileOpenDialogType = ('open' | 'save')
type TemplateTaskRunner = (task: TemplateTask) => Promise<any>;
type TemplateTaskGenerator = (...args: any) => Promise<TemplateTask[]>;

interface TemplateTask {
    data: any
}

interface TemplateConfig {
    name: string,
    capabilities?: TemplateCapabilities[],
    multiThreadingEnabled: boolean,
    userSettings: Array<UserSetting>,
    email?: string,
    rewardTronAddress?: string
}

type TemplateCapabilities = ('axios' | 'puppeteer')
type UserSettingsInput = ('OutputFile' | 'SourceFileTaskPerLine')

interface UserSetting {
    type: UserSettingsInput,
    title: string,
    fileName?: string | null,
    required?: boolean,
    errorString?: string | null
}
