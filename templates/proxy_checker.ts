import * as interfaces from "../electron/main/interface"

export default class Template implements OpenSubmitterTemplateProtocol {

    axios = null;

    config: TemplateConfig = {
        name: 'Proxy Checker from MotaHaker',
        userSettings: [
            {
                type: 'SourceFileTaskPerLine',
                title: 'Proxy List',
                required: true
            },{
                type: 'OutputFile',
                title: 'Check Results',
                required: true
            }
        ]
    };

    async run(...args) {

    }

}
