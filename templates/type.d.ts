
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

type CaptchaType = ('image' | 'RecaptchaV2' | 'RecaptchaV3' | 'HCaptcha' | 'FunCaptcha')
interface Captcha {
    type: CaptchaType,
    imageBody?: string,         //  for image captcha
    imageBodyBase64?: string,   //  alternative for image captcha
    websiteURL?: string,        //  for all JS captchas
    websiteKey?: string,
    v3score?: (0.3 | 0.7 | 0.9) //  for Recaptcha V3
    isInvisible?: boolean       //  for Recaptcha V2 and HCaptcha,
    extraParameters?: object    //  any extra parameters go here

    // If set, captcha will be solved via this proxy.
    // If not set, captcha will be solved without proxy.
    proxyAddress?: string,
    proxyPort?: number,
    proxyLogin?: string,
    proxyPassword?: string

}