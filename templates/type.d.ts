
interface OpenSubmitterTemplateProtocol {
    config?: TemplateConfig,
    generateTasks: (...args: any) => Promise<TemplateTask[]>,
    runTask: (task: TemplateTask) => Promise<any>,
    getPuppeteerArguments?: () => string[],
    solveCaptcha?: (captcha: Captcha) => Promise<string | object>,
    getIMAPMessages?: (config: object) => Promise<any[]>,
    deleteIMAPMessage?: (uid: number) => Promise<void>,
    closeIMAPConnection?: () => Promise<void>,
    postResultToTable?: (result: object) => void,
    getRandomName?: (requirements: GeneratedPersonRequirements) => GeneratedPerson,
    generatePassword?: (withSpecial: boolean, withNumbers: boolean) => string,
    log?: Function

    electronAssetsDirectory?: string
}

interface TemplateTask {
    data: any
}

interface ResultTableRow {
    title: string,              //  title for the table heading
    value?: string,             //  text of the result
    isResult?: boolean,         //  this field will serve as a colored task result status Success/Failed
    nowrap?: boolean            //  this tells not to break the text
}

interface TemplateConfig {
    name: string,
    description: string,
    capabilities?: TemplateCapabilities[],
    multiThreadingEnabled: boolean,
    userSettings: UserSetting[],
    email?: string,
    icon?: string,
    rewardTronAddress?: string,
    resultTableHeader?: ResultTableRow[]
}

type TemplateCapabilities = ('axios' | 'puppeteer')
type UserSettingsInput = ('OutputFile' | 'ExportFile' | 'SourceFile' | 'TextInput' | 'Checkbox' | 'Select' | 'Radio' | 'Textarea')
type UIWidth = (50 | 100)

interface SelectableOption {
    title: string,
    value: string
}

interface UserSetting {
    type: UserSettingsInput,
    name: string,
    title: string,
    value?: string | boolean | null,
    placeholder?: string,
    selectableOptions?: SelectableOption[],
    fileName?: string | null,
    required?: boolean,
    errorString?: string | null,
    uiWidth?: UIWidth
}

type CaptchaType = ('image' | 'RecaptchaV2' | 'RecaptchaV3' | 'HCaptcha' | 'FunCaptcha' | 'Geetest3' | 'Geetest4' | 'Turnstile')
interface Captcha {
    type: CaptchaType,
    imageBodyBase64?: string,   //  for image captcha
    websiteURL?: string,        //  for all JS captchas
    websiteKey?: string,        //  "websiteKey" for Recaptcha, HCaptcha and Turnstile, "gt" and "captchaId" for Geetest, "websitePublicKey" for FunCaptcha
    extraParameters?: ExtraCaptchaParameters    //  any other extra parameters go here

    // If set, captcha will be solved via this proxy.
    // If not set, captcha will be solved without proxy.
    proxyType?: ('http' | 'socks4' | 'socks5'),
    proxyAddress?: string,
    proxyPort?: number,
    proxyLogin?: string,
    proxyPassword?: string
}

interface ExtraCaptchaParameters {
    userAgent: string,                  //  custom user-agent, required for proxy-on tasks
    v3score?: (0.3 | 0.7 | 0.9)         //  for Recaptcha V3
    pageAction: string | null           //  page action for Recaptcha V3 and Turnstile
    isInvisible?: boolean               //  for Recaptcha V2 and HCaptcha
    recaptchaDataSValue?: string        //  "data-s" value for Recaptcha V2 (google.com domains captcha)
    enterprisePayload?: any             //  custom enterprise payload data for HCaptcha or FunCaptcha
    APISubdomain?: string               //  API subdomain value for FunCaptcha or Geetest
    funcaptchaDataBlob?: string         //  extra token for FunCaptcha
    geetestChallenge?: string           //  challenge token for Geetest
    geetest4InitParameters?: any        //  initialization parameters for Geetest4
}

interface TemplateResult {
    fields: string[],
    values: object
}

interface IMAPModule {
    openBox: Function,
    search: Function,
    deleteMessage: Function,
    closeBox: Function
}

// Reference: https://github.com/mscdex/node-imap#connection-instance-methods
interface IMAPConfig {
    host: string,
    port: number,
    user: string,
    password: string,
    tls?: boolean,
    tlsOptions?: object,
    xoauth?: string,
    xoauth2?: string,
    autotls?: ('always' | 'required' | 'never'),
    connTimeout?: number,
    authTimeout?: number,
    socketTimeout?: number,
    keepalive?: any,
    debug?: Function
}

interface GeneratedPersonRequirements {
    randomGender?: boolean,
    isMale?: boolean,
    minimumUsernameLength?: number,
    usernameWithANumber?: boolean
}

interface GeneratedPerson {
    name: string,
    surname: string,
    username: string,
    password: string
}