import fs from "fs";
import * as interfaces from "../electron/main/interface"

export default class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {
        name: 'Template tester from MotaHaker',
        userSettings: [
            {
                type: 'OutputFile',
                title: 'Where to write the output of the download',
                fileName: "",
                required: true
            }
        ]
    };

    page = null;


    async run() {
        try {
            console.log('navigating...');
            await this.page.goto('http://bropanel.com/', {
                waitUntil: "networkidle0",
                timeout: 20000
            });
        } catch (e) {
            console.log('err while loading the page: ' + e);
        }
        const result = await this.page.content();
        if (this.config.userSettings[0].fileName.length > 0) {
            fs.writeFileSync(this.config.userSettings[0].fileName, result);
        } else {
            console.log('no filename is specified!');
        }
        return result;
    }

}
