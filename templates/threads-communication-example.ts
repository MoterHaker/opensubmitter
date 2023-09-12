/// <reference path="../templates/type.d.ts" />

class Template implements OpenSubmitterTemplateProtocol {

    sharedData: number[] = []

    config: TemplateConfig = {

        // Name and description to display in OpenSubmitter's UI:
        name: 'Threads communication example',
        description: 'This example demonstrates usage of broadcastMessageToThreads and receiveBroadcastMessage methods, ' +
            'which allows multiple threads to communicate and share some arbitrary data. ' +
            'For example, to avoid duplicate results when working on recursive tasks.',

        // This tells OpenSubmitter that the user is allowed to specify amount of threads:
        multiThreadingEnabled: true,

        // User's settings for OpenSubmitter UI:
        userSettings: [
            {
                type: 'ExportFile',
                name: 'outputFile',
                title: 'Where to export the data',
                value: 'CSV',
                fileName: "",
                required: false,
                uiWidth: 100
            }
        ],

        resultTableHeader: [
            {
                title: 'Unique number'
            }
        ],
    };

    async generateTasks(...args: any): Promise<TemplateTask[]> {

        const result: TemplateTask[] = [];

        for (let i = 0;i<100;i++) {

            result.push({
                data: {
                    number: i
                }
            })
        }

        return result
    }


    async runTask(task: TemplateTask) {
        // In each task run we will generate a random number from 0 to 100
        // and check if it already exists in this.sharedData.
        // If it does, then we'll retry attempt after a delay.
        // If it doesn't, we share generated number with other threads.

        // random delay first
        this.log('trying to generate new number')
        await this.delay(Math.floor(Math.random() * 1000)+100);

        const randomNumber = Math.floor(Math.random() * 100);
        if (this.sharedData.indexOf(randomNumber) !== -1) {
            this.log(`retrying, ${randomNumber} already exists in shared data, which has ${this.sharedData.length} records`);
            await this.runTask(task);
        } else {
            this.log(`unique random number: ${randomNumber}, shared data size: ${this.sharedData.length}`)
            this.sharedData.push(randomNumber);

            //broadcasting shared data to other threads
            this.broadcastMessageToThreads(this.sharedData);

            //posting results to the UI table
            this.postResultToTable({
                'Unique number': randomNumber
            })

            this.postResultToStorage({
                fields: ['number'],
                values: {
                    number: randomNumber
                }
            })
        }
    }

    delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
    }

    receiveBroadcastMessage(data: any) {
        this.log('received shared data, size: '+data.length);

        //checking for duplicates
        for (const number of data) {
            if (this.sharedData.indexOf(number) === -1) {
                this.sharedData.push(number);
            }
        }
    }

    // keep empty, will be replaced by Template Controller
    broadcastMessageToThreads(data: any) {

    }

    // will be overridden by Template Controller
    postResultToTable(result: object) {

    }

    // keep empty, will be replaced by Template Controller
    log(msg: string) {

    }

    // keep empty, will be replaced by Template Controller
    postResultToStorage(result: TemplateResult) {

    }

}