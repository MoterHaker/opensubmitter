/// <reference path="type.d.ts" />

class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {

        name: 'IMAP parsing example from MotaHaker',
        description: 'A template demonstrating retrieving contents from IMAP server. ' +
            'May be useful for getting confirmation links clicked, entering 2FA codes, etc. ' +
            'OpenSubmitter provides a wrapper for imap-simple library ( https://www.npmjs.com/package/imap-simple ), and ' +
            'MailParser ( https://nodemailer.com/extras/mailparser/ ), which makes retrieving mail a bit easier.',

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
                // The config is taken from https://www.npmjs.com/package/imap-simple
                user: this.config.userSettings.find(setting => setting.name === 'login').value,
                password: this.config.userSettings.find(setting => setting.name === 'password').value,
                host: this.config.userSettings.find(setting => setting.name === 'host').value,
                port: parseInt(this.config.userSettings.find(setting => setting.name === 'port').value.toString()),
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            } as IMAPConfig
        }]

    }

    async runTask(task: TemplateTask) {

        this.log('getting messages');
        const messages = await this.getIMAPMessages(task.data)

        this.log('got '+messages.length+' messages')
        for (const message of messages) {

            // Object message is the result of mailparser.simpleParser function output
            // It has many more properties, like attachments, all the headers, etc..
            // Uncomment this to see in the console what else it has.
            //console.log(message)

            // Post message details to the results table
            this.postResultToTable({
                'UID': message.UID,
                'From': message.from,
                'Subject': message.subject,
                'Body': message.body
            })

            // Remove message by some criteria
            if (message.from.indexOf('something') !== -1) {
                this.log('removing message '+message.UID);
                await this.deleteIMAPMessage(message.UID);
            }

            await this.delay(100); //small pause to let IPC process the message
        }

        await this.closeIMAPConnection();
    }

    // will be overridden by Template Controller
    async getIMAPMessages(config: IMAPConfig): Promise<any[]> {
        return []
    }

    // will be overridden by Template Controller
    async deleteIMAPMessage(uid: number): Promise<void> {

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

    async closeIMAPConnection(): Promise<void> {

    }



}