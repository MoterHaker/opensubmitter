/// <reference path="type.d.ts" />
const fs = require("fs");
const axios = require("axios");

class Template implements OpenSubmitterTemplateProtocol {

    axios = null;

    config: TemplateConfig = {
        name: 'Proxy Checker Mofo',
        email: 'author@email.com',
        multiThreadingEnabled: true,
        rewardTronAddress: 'TPNnu4Wc5dUtpVt5dpQce32WnTrd4P5555',
        capabilities: ['axios'],
        userSettings: [
            {
                type: 'SourceFileTaskPerLine',
                name: 'proxyList',
                title: 'Proxy List',
                fileName: "/Users/flash/Documents/work/opensubmitter/templates/reproxy_pass_small.txt",
                required: true
            },{
                type: 'OutputFile',
                name: 'resultList',
                title: 'Check Results',
                fileName: "/Users/flash/Documents/work/opensubmitter/templates/out.txt",
                required: true
            },{
                type: 'TextInput',
                name: 'testWebsite',
                title: 'Testing website',
                value: "https://www.google.com/",
                required: true
            },{
                type: 'TextInput',
                name: 'controlPhrase',
                title: 'Control phrase',
                value: "initial-scale=1, minimum-scale=1",
                required: true
            }
        ]
    };

    async generateTasks(...args: any): Promise<TemplateTask[]> {
        //reading proxy list file, form an array of proxies
        const proxies = fs.readFileSync(this.config.userSettings.find(setting => setting.name === 'proxyList').fileName)
                          .toString()
                          .split("\n");

        const tasks: TemplateTask[] = [];

        //loop through proxies and build the task list
        for (const proxyLine of proxies) {
            if (proxyLine.length < 5) continue;
            const proxySplit = proxyLine.split(":");
            if (proxySplit.length < 2) continue;
            let proxyAddress, proxyPort, proxyLogin, proxyPassword;
            if (proxySplit.length >= 2) {
                proxyAddress = proxySplit[0];
                proxyPort = parseInt(proxySplit[1]);
            }
            if (proxySplit.length === 4) {
                proxyLogin = proxySplit[2];
                proxyPassword = proxySplit[3];
            }
            tasks.push({
                data: {
                    proxyAddress,
                    proxyPort,
                    proxyLogin,
                    proxyPassword
                }
            })
        }

        //cleaning output file
        const resultListFile = this.config.userSettings.find(setting => setting.name === 'resultList').fileName;
        fs.writeFileSync(resultListFile, "");

        return tasks;
    }

    async runTask(task: TemplateTask) {
        const testWebsite = this.config.userSettings.find(setting => setting.name === 'testWebsite').value;
        const controlPhrase = this.config.userSettings.find(setting => setting.name === 'controlPhrase').value;
        const resultListFile = this.config.userSettings.find(setting => setting.name === 'resultList').fileName;
        this.log("opening test website..")
        let result;
        try {
            result = await axios.get(testWebsite, {
                timeout: 5000,
                validateStatus: function (status) {
                    return status < 500; // Resolve only if the status code is less than 500
                },
                proxy: {
                    protocol: 'http',
                    host: task.data.proxyAddress,
                    port: task.data.proxyPort,
                    auth: {
                        username: task.data.proxyLogin,
                        password: task.data.proxyPassword
                    }
                }
            })
        } catch (e) {
            this.log(`proxy ${task.data.proxyAddress}:${task.data.proxyPort} failed: `+e.toString())
        }
        if (result) {
            if (result.data.indexOf(controlPhrase) !== -1) {
                this.log(`proxy ${task.data.proxyAddress}:${task.data.proxyPort} is good`)
                if (task.data.proxyLogin) {
                    fs.appendFileSync(resultListFile, `${task.data.proxyAddress}:${task.data.proxyPort}:${task.data.proxyLogin}:${task.data.proxyPassword}\n`)
                } else {
                    fs.appendFileSync(resultListFile, `${task.data.proxyAddress}:${task.data.proxyPort}\n`)
                }
            }
        }
        await this.delay(500); //todo remove
    }

    //overridden by super class
    log(msg: string) {

    }

    delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
    }

}
