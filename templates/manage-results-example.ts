/// <reference path="../templates/type.d.ts" />

class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {

        // Name and description to display in OpenSubmitter's UI:
        name: 'Export results example',
        description: 'This example demonstrates usage of postResultToStorage method, ' +
        'which keeps results of all threads in one place and allows automated export to different file formats: ' +
        'CSV, JSON, SQL, MongoDB',

        // This tells OpenSubmitter that the user is allowed to specify amount of threads:
        multiThreadingEnabled: true,

        // User's settings for OpenSubmitter UI:
        userSettings: [
            {
                type: 'Textarea',
                name: 'emails',
                title: 'Example data: IMAP accounts list, one per line. Format: imapserver:port:email:login:password. '+
                    'These lines will be split at exported to the output file',
                value: 'imap.gmail.com:993:mymail@gmail.com:mymail1@gmail.com:password1231\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail2@gmail.com:password1232\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail3@gmail.com:password1233\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail4@gmail.com:password1234\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail5@gmail.com:password1235\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail6@gmail.com:password1236\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail7@gmail.com:password1237\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail8@gmail.com:password1238\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail9@gmail.com:password1239\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail10@gmail.com:password12310\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail11@gmail.com:password12311\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail12@gmail.com:password12312\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail13@gmail.com:password12313\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail14@gmail.com:password12314\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail15@gmail.com:password12315\n' +
                    'imap.gmail.com:993:mymail@gmail.com:mymail16@gmail.com:password12316',
                required: false,
                uiWidth: 100
            }, {
                type: 'ExportFile',
                name: 'outputFile',
                title: 'Where to export the data',
                value: 'CSV',
                fileName: "",
                required: true,
                uiWidth: 100
            },
        ]
    };

    async generateTasks(...args: any): Promise<TemplateTask[]> {
        const emailList = this.config.userSettings.find(setting => setting.name === 'emails').value.toString().split("\n");
        const result: TemplateTask[] = [];

        for (const emailRow of emailList) {
            const emailSplit = emailRow.split(":");
            if (emailSplit.length !== 5) continue;
            const [imapServer, imapPortStr, email, emailLogin, emailPassword] = emailSplit;
            const imapPort = parseInt(imapPortStr)

            result.push({
                data: {
                    imapServer,
                    imapPort,
                    email,
                    emailLogin,
                    emailPassword
                }
            })
        }

        return result
    }


    async runTask(task: TemplateTask) {
        this.postResultToStorage({
            fields: ['server', 'port', 'email', 'login', 'password'],
            values: {
                'server':   task.data.imapServer,
                'port':     task.data.imapPort,
                'email':    task.data.email,
                'login':    task.data.emailLogin,
                'password': task.data.emailPassword
            }
        })
    }

    delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
    }

    // keep empty, will be replaced by Template Controller
    postResultToStorage(result: TemplateResult) {

    }

}