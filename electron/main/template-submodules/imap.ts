/// <reference path="../../../templates/type.d.ts" />


class IMAPSimpler {

    IMAPConnection: IMAPModule | null;

    private log(str) {
        console.log(str);
    }

    async getIMAPMessages(config: IMAPConfig): Promise<any[]> {
        const simpleParser = require('mailparser').simpleParser;
        const imapsimple = require('imap-simple');

        this.log('opening an IMAP connection');
        this.IMAPConnection = null;
        try {
            this.IMAPConnection = await imapsimple.connect({ imap: config });
        } catch (e) {
            this.log('could not open connection '+(e as String).toString());
            return null;
        }

        this.log('opening mail INBOX')
        await this.IMAPConnection.openBox('INBOX');

        this.log('getting list of messages from INBOX')
        const messages = await this.IMAPConnection.search(['ALL'], { bodies: [''], struct: true });

        const result = [];

        for (const message of messages) {

            const allParts = message.parts.find(part => part.which === "");

            const mail = await simpleParser(allParts.body);
            mail["UID"] = message.attributes.uid;
            if (mail.from) {
                mail["fromFull"] = mail.from;
                mail["from"] = mail.from.text;
            }
            if (mail.to) {
                mail["toFull"] = mail.to;
                mail["to"] = mail.to.text;
            }

            if (mail.html) mail["body"] = mail.textAsHtml;
            else mail["body"] = mail.text;
            result.push(mail);

        }

        this.log(`downloaded ${result.length} IMAP messages`)


        return result;
    }

    async deleteIMAPMessage(uid: number): Promise<void> {
        await this.IMAPConnection.deleteMessage([uid])
    }

    async closeIMAPConnection(): Promise<void> {
        await new Promise(resolve => {
            this.IMAPConnection.closeBox(true, resolve);
        });
    }
}