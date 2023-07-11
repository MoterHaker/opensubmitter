
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
    description?: string,
    capabilities?: TemplateCapabilities[],
    multiThreadingEnabled: boolean,
    userSettings: Array<UserSetting>,
    email?: string,
    rewardTronAddress?: string
}

type TemplateCapabilities = ('axios' | 'puppeteer')
type UserSettingsInput = ('OutputFile' | 'SourceFileTaskPerLine' | 'TextInput')
type UIWidth = (50 | 100)

interface UserSetting {
    type: UserSettingsInput,
    name: string,
    title: string,
    value?: string | null,
    fileName?: string | null,
    required?: boolean,
    errorString?: string | null,
    uiWidth?: UIWidth
}
