/// <reference path="type.d.ts" />

class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {

        name: 'IMAP parsing example from MotaHaker',
        description: 'A template demonstrating retrieving contents from IMAP server. ' +
            'May be useful for getting confirmation links clicked, entering 2FA codes, etc.',

        multiThreadingEnabled: false,

        userSettings: [
            {
                type: 'TextInput',
                title: 'IMAP server',
                name: 'host',
                uiWidth: 50,
                required: true
            },{
                type: 'TextInput',
                title: 'IMAP port',
                name: 'port',
                uiWidth: 50,
                value: "993",
                required: true
            },{
                type: 'TextInput',
                title: 'Login',
                name: 'login',
                uiWidth: 50,
                required: true
            },{
                type: 'TextInput',
                title: 'Password',
                name: 'password',
                uiWidth: 50,
                required: true
            }
        ],
        resultTableHeader: [
            {
                title: 'UID',
                nowrap: true
            },{
                title: 'From'
            },{
                title: 'Subject'
            },{
                title: 'Body'
            }
        ]
    };

    async generateTasks(...args: any): Promise<TemplateTask[]> {

        return [{
            data: {
                imap: {
                    user: this.config.userSettings.find(setting => setting.name === 'login').value,
                    password: this.config.userSettings.find(setting => setting.name === 'password').value,
                    host: this.config.userSettings.find(setting => setting.name === 'host').value,
                    port: this.config.userSettings.find(setting => setting.name === 'port').value,
                    tls: true,
                    tlsOptions: { rejectUnauthorized: false },
                    authTimeout: 10000
                }
            }
        }]

    }

    async runTask(task: TemplateTask) {

        this.log('getting messages');
        const messages = await this.getIMAPMessages(task.data)

        this.log('got '+messages.length+' messages')
        for (const message of messages) {

            const header = message.parts.find(part => part.which === "HEADER");
            const text = message.parts.find(part => part.which === "TEXT");
            let from, subject, body
            if (header && header.body && header.body.from) {
                from = header.body.from;
            } else {
                from = 'could not parse'
            }
            if (header && header.body && header.body.subject) {
                subject = header.body.subject;
            } else {
                subject = 'could not parse'
            }
            if (text && text.body) {
                body = text.body
            } else {
                body = 'could not parse'
            }

            this.postResultToTable({
                'UID': message.attributes.uid,
                'From': from,
                'Subject': subject,
                'Body': body
            })

            await this.delay(100); //small pause to let IPC process the message
        }
    }

    // will be overridden by Template Controller
    async getIMAPMessages(config): Promise<any[]> {
        return []
    }

    // will be overridden by Template Controller
    postResultToTable(result: object) {

    }

    // will be overridden by Template Controller
    log(msg) {

    }

    // will be overridden by Template Controller
    delay(time) {

    }



}