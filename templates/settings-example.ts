/// <reference path="type.d.ts" />
const fs = require("fs")
class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {
        name: 'Settings example',
        description: 'An empty template to demonstrate settings capabilities',
        multiThreadingEnabled: false,
        userSettings: [
            {
                // see function generateTasks for examples of using these settings
                type: 'SourceFile',
                name: 'aSource1',
                title: 'Existing file selection dialog, path is saved to "fileName" property. Required option ("required" is true).',
                fileName: "",
                required: true,
                uiWidth: 100
            },{
                type: 'OutputFile',
                name: 'anOutput1',
                title: 'A file saving dialog width 100% UI width',
                fileName: "",
                required: false,
                uiWidth: 100
            },{
                type: 'Radio',
                name: 'radio_option',
                title: 'A radio button to choose an option, 50% UI width',
                value: "option2",
                selectableOptions: [
                    {
                        title: "Option 1 text",
                        value: "option1"
                    },{
                        title: "Option 2 text",
                        value: "option2"
                    },{
                        title: "Option 3 text",
                        value: "option3"
                    }
                ],
                uiWidth: 50
            },{
                type: 'Select',
                name: 'select_list',
                title: 'A drop-down with 100% width',
                value: 'default',
                selectableOptions: [
                    {
                        title: 'Default',
                        value: 'default'
                    },{
                        title: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
                        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15'
                    },{
                        title: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
                        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
                    }
                ],
                uiWidth: 100
            },{
                type: 'Checkbox',
                name: 'checkbox1',
                title: 'A checkbox option with 50% width, default = checked',
                value: true,
                uiWidth: 50,
            },{
                type: 'Checkbox',
                name: 'checkbox2',
                title: 'Another checkbox unchecked',
                value: false,
                uiWidth: 50,
            },{
                type: 'TextInput',
                name: 'textvalue1',
                title: 'A text input for one-line strings',
                value: "This is an example",
                uiWidth: 50,
            },{
                type: 'TextInput',
                name: 'textvalue2',
                title: 'Another text input',
                value: "Another example",
                uiWidth: 50,
            },{
                type: 'Textarea',
                name: 'largetextvalue1',
                title: 'Large textarea input',
                value: "Default text",
                uiWidth: 100,
            }
        ]
    }

    // Usually are accessing your settings here to generate tasks

    async generateTasks(...args: any): Promise<TemplateTask[]> {

        // read file from aSource1
        const aSource1Path = this.config.userSettings.find(setting => setting.name === 'aSource1').fileName;
        const fileContents = fs.readFileSync(aSource1Path).toString()

        const anOutput1Path = this.config.userSettings.find(setting => setting.name === 'anOutput1').fileName;
        // do something with output

        // radio button value
        const radio_option = this.config.userSettings.find(setting => setting.name === 'radio_option').value;

        // drop-down value
        const select_list = this.config.userSettings.find(setting => setting.name === 'select_list').value;

        // checkbox value ( boolean )
        const checkbox1 = this.config.userSettings.find(setting => setting.name === 'checkbox1').value;

        // text input value
        const input1 = this.config.userSettings.find(setting => setting.name === 'textvalue1').value;

        // textarea value
        const largeinput1 = this.config.userSettings.find(setting => setting.name === 'largetextvalue1').value;

        return [
            {
                data: {
                    fileContents,
                    anOutput1Path,
                    radio_option,
                    select_list,
                    checkbox1,
                    input1,
                    largeinput1
                }
            }
        ]
    }


    async runTask(task: TemplateTask) {
        this.log('output file path: ' + task.data.anOutput1Path);
        await this.delay(100);
        this.log('radio option value: ' + task.data.radio_option);
        await this.delay(100);
        this.log('drop down value: ' + task.data.select_list);
        await this.delay(100);
        this.log('checkbox value: ' + (task.data.checkbox1 ? 'checked' : 'not checked'));
        await this.delay(100);
        this.log('text input 1 value: ' + task.data.input1);
        await this.delay(100);
        this.log('textarea value: ' + task.data.largeinput1);
        await this.delay(100);
        this.log('file contents: ' + task.data.fileContents);
    }

    log(message) {

    }

    delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
    }

}