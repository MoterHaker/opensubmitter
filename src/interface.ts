interface OpenSubmitterTemplateProtocol {
    config: TemplateConfig,
    run: Function
}

interface TemplateConfig {
    name: string,
    userSettings: Array<UserSetting>;
}

interface UserSetting {
    type: ('OutputFile' | 'SourceFileTaskPerLine'),
    title: string,
    fileName?: string,
    required?: boolean
}