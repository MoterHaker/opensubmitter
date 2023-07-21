/// <reference path="type.d.ts" />
const fs = require("fs")
const axios = require("axios");

class Template implements OpenSubmitterTemplateProtocol {

    config: TemplateConfig = {
        name: 'Captcha solving example from MotaHaker',
        description: 'A template demonstrating captcha solving capabilities of Open Submitter. ' +
                     'It simply solves several captchas of different in multi-threaded mode using Anti-Captcha API service. API key must be provided in the settings.',
        multiThreadingEnabled: true,
        userSettings: [],
        resultTableHeader: [
            {
                title: 'Captcha type',
                nowrap: true,
            },{
                title: 'Solution'
            },{
                title: 'Status',
                nowrap: true,
                isResult: true
            }
        ]
    };



    async generateTasks(...args: any): Promise<TemplateTask[]> {

        const geetest3ChallengeRequest = (await axios.get('https://login.flyme.cn/sec/geetest3?t=1676261590118')).data;
        console.log('geetest3Challenge', geetest3ChallengeRequest);

        return [{
            data: {
                type: 'image',
                //text: probably "szhPL"
                imageBodyBase64: 'iVBORw0KGgoAAAANSUhEUgAAAG4AAAAoCAMAAAAohD+4AAAASFBMVEX///+LRRP5+fndzL+2imuZXDCYWy+mckzCn4bw5+Hi0MSoc07FoonTuabr4tzPtaK0iGm+mX7fzsKvf17IqpSOShqjbEW9lnqJ4/iZAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEWUlEQVRYhY1YibLlKAgNMa5J1J71//90UMC4va5JVeflKrIcDqh9HOd5HsML2kvGoPsaJk7gL0gW4JqEFzlc+8MU9GPQfQ0TojtCfd5ReFGAa1dXYPERui/Y6ImGzD0kopzzo1IQ4WMTOiw+NnuwndBkzcQqcpfPHeQovKaOTMEw9iUMNhMZ9ecUPEVKlvdQblJHpvaMOIq5YQIDUkW/jHkNxmmtNr7WNGzswUyVnprDxItxeAQvt5gx0njGPXvLa8PaJUM9NSG6WxtjryepgiIk/BclAoz0hhR3a6vIjioncOouWdhRc34s2rwpApW1DMYBqi/IHVWkmGtS7BMGak7G4DClADCEV3fjf/9zvxsot1SRYkaYbpfcXSLgQnJNobFoJ50Q8FsdIKUHF4tw6bU0sMPNirq0sSJUuZEh0WxAFboiK8ZSJSn4E1ylJZc5/ggHhlxc2ED5UcVb8a5iV53STsINPPlLzDErj6pbE+zow1WIC/VXnhhNX0KVDvhbcTHfEnjUszmwJ6q26gIE8T4MlTZqwRf4qmViNH2xRgLcaiHAWMySF/1HM+fKII/bl8diiZTSCffYjI4hdQz3GW5Bq7PHY0axXIGcmxWZy+IDWgmWcpeHNt/00Z+L/TmPpyVH7DHVdCwpNhwbp9P25m5cay82nTZQNqoUI6Y1JiidSOwlXh+kFOzjZYWvVNUsEks6Jf7Yt91WtkyVCk3qSNokw+ctc4wobjmC6smfxagqY1kq0/cANctda232cH9s8618BVlNliMnm4GGvxRV4tUWbDt8c0Dy23exs3HDEvzBCNAXaxSof3EakEMOnn9h4HbX8I8hPiOth6nEiTexwq+a3/WrJFtJZrl2XaXhI11lhHLYgFIRN4FSC105lmZV1ghO90NUtAIqPu8RLXMW17oK9FIF0wZUSfl8G57QRNEa4bg8tcfJD+4QirChcJfUVap43O9poOzMxR5UvMXzxGsma6RxGvOETQl3qQJOnWNgalsuS6ruht3F6YyTZnN86ZTH0p74fiyfjj20rxHojGcic9y7xBGYzaVT1k5jULTMdfpRJTK9xdtc4gcuAR0bJqPme+g5LMy5UpzY6mY6J6rQKSEKF3OfpfBhMlCFSyb0YySMniNztbW2nKGQC+dIFbRX4jMuvVXj05lrmJyQfG9NTlu9NUdQIkuN0cXedWUYDvD8J+ZOE1Ily6m/o7M73yZz+ca773m4g/xwexq6ipJdJHHXgafcoV5JXTkXnJ7wzH3LCLInR6F9v1mOZ/zhWOuDUp9Q8VElPC9lF3y5vvFtR43XBNT9Zsiv/zrIdi/YdJWx67CkT4SsFSvzNaE3ABOA891yMfUJ9ZiEx7ZNCdb7w3Sa3G3j04bQv2Yfx04LsAjDKNJfP/+HvdnHEZjpBttdz4bbxwzQQpU5vz/Ym+5H3/VstbL8t8BvqLIg0W6hMzXnZH84zJp/Q5WZxLIa1jqGPUFmBcfxHyqII0fLhdGjAAAAAElFTkSuQmCC'
            }
        },{
            data: {
                type: 'RecaptchaV2',
                websiteURL: 'https://huev.com/',
                websiteKey: '6Lcyu8UZAAAAACwSh6Xf58WrNXTu0LLu4F85xf20'
            }
        },{
            data: {
                type: 'RecaptchaV3',
                websiteURL: 'https://login2.caixa.gov.br',
                websiteKey: '6LcEpfsUAAAAAIzeVJB_G44GL5Y-Mh7M6z9ojtBv',
                extraParameters: {
                    v3score: 0.3,
                    pageAction: 'login'
                }
            }
        },{
            data: {
                type: 'HCaptcha',
                websiteURL: 'https://www.ebay.co.uk/',
                websiteKey: '195eeb9f-8f50-4a9c-abfc-a78ceaa3cdde'
            }
        },{
            data: {
                type: 'FunCaptcha',
                websiteURL: 'https://twitter.com',
                websiteKey: '2CB16598-CB82-4CF7-B332-5990DB66F3AB',
                extraParameters: {
                    funcaptchaDataBlob: "{'blob':'some value'}",
                    APISubdomain: 'client-api.arkoselabs.com'
                }
            }
        },{
            /**
             * This example won't work, as the geetestChallenge needs to be grabbed fresh
             */
            data: {
                type: 'Geetest3',
                websiteURL: 'https://login.flyme.cn/',
                websiteKey: 'f3da43872204b2aa7a5da1c71591760b',
                extraParameters: {
                    geetestChallenge: geetest3ChallengeRequest.challenge
                }
            }
        },{
            data: {
                type: 'Geetest4',
                websiteURL: 'https://bitget.com/',
                websiteKey: 'e9ca9c9ca19ad540a8017f5c107b2d0f',
                extraParameters: {
                    geetest4InitParameters: {
                        "riskType": "slide"
                    }
                }
            }
        },{
            data: {
                type: 'Turnstile',
                websiteURL: 'https://website.com/',
                websiteKey: '0x4AAAAAAABD0Inoxs-yJ8im',
                extraParameters: {
                    pageAction: "test"
                }
            }
        }]
    }


    async runTask(task: TemplateTask) {
        this.log('solving captcha type '+task.data.type)
        try {
            let result = await this.solveCaptcha(task.data as Captcha)
            if (typeof result === "object") result = JSON.stringify(result);
            this.log(task.data.type+" solved: " + result);

            // post to results table in UI
            this.postResultToTable({
                'Captcha type': task.data.type,
                'Solution': result,
                'Status': true
            })
        } catch (e) {
            this.log("could not solve captcha type "+task.data.type+": "+e.toString())

            // post to results table in UI
            this.postResultToTable({
                'Captcha type': task.data.type,
                'Solution': '',
                'Status': false
            })
        }
    }

    // will be overridden by Template Controller
    postResultToTable(result: object) {

    }

    // will be overridden by Template Controller
    async solveCaptcha(captcha: Captcha): Promise<string | object> {
        return ""
    }

    // will be overridden by Template Controller
    log(msg: string) {

    }

}
