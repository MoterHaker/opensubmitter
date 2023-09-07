/// <reference path="type.d.ts" />
const fst = require("fs");
const axios = require("axios");

interface LinkedinTemplateTask extends TemplateTask {
    data: {
        name: string
        surname: string
        username: string
        password: string
        proxyServer: string
        proxyPort: string
        proxyLogin?: string
        proxyPassword?: string
        imapServer: string
        imapPort: number
        email: string
        emailLogin: string
        emailPassword: string
        outputFile: string
    }
}

class Template implements OpenSubmitterTemplateProtocol {
    config: TemplateConfig = {

        // Name and description to display in OpenSubmitter's UI:
        name: 'Linkedin Account Registrator',
        description: 'Registers accounts with email confirmation. Requires list of emails and IMAP server credentials, as well as proxies. Output is a JSON file with twitter name, email, twitter password, used proxies and collected cookies.',

        // Based on this setting, OpenSubmitter will inject Puppeteer's page object into this template
        capabilities: ['puppeteer'],

        // This tells OpenSubmitter that the user is allowed to specify amount of threads:
        multiThreadingEnabled: true,

        // User's settings for OpenSubmitter UI:
        userSettings: [
            {
                type: 'Textarea',
                name: 'emails',
                title: 'IMAP accounts list, one per line. Format: imapserver:port:email:login:password',
                placeholder: 'imap.gmail.com:993:mymail@gmail.com:mymail@gmail.com:password123',
                required: false
            }, {
                type: 'Textarea',
                name: 'proxies',
                title: 'Proxy list, one per line. Format: server;port;login;password',
                placeholder: '12.34.34.56:3128:login:password',
                required: false
            }, {
                type: 'OutputFile',
                name: 'outputFile',
                title: 'Where to write the list of accounts in JSON format',
                fileName: "",
                required: true,
                uiWidth: 100
            },
        ],

        resultTableHeader: [
            {
                title: 'Email'
            }, {
                title: 'Name'
            }, {
                title: 'Password'
            }, {
                title: 'Cookies'
            }, {
                title: 'Error'
            }, {
                title: 'Result',
                isResult: true
            }
        ],

        email: 'dev@captcha.pub',
        rewardTronAddress: 'TGVF1UKmU2iJToW3Lv3pJ3VqrdT2Bq7yvq',
        icon: 'https://c0.lestechnophiles.com/c.clc2l.com/c/thumbnail256webp/t/t/w/twitter-MAWXNC.png'
    };

    // Dummy variable, will be overridden by OpenSubmitter with Puppeteer's page object
    page = null;
    task: TwitterTemplateTask | null = null;

    async generateTasks(...args: any): Promise<TemplateTask[]> {
        const emailList = this.config.userSettings.find(setting => setting.name === 'emails')?.value?.toString().split("\n") ?? [];
        const proxyList = this.config.userSettings.find(setting => setting.name === 'proxies')?.value?.toString().split('\n') ?? []
        const outputFile = this.config.userSettings.find(setting => setting.name === 'outputFile')?.fileName;

        if (emailList?.length === 0) {
            this.log('Empty list of emails');
            return [];
        }
        if (proxyList?.length === 0) {
            this.log('Empty list of proxies')
            return [];
        }

        const proxies: Array<{
            proxyServer: string;
            proxyPort: string;
            proxyLogin?: string;
            proxyPassword?: string;
        }> = [];
        for (const proxyRow of proxyList) {
            const proxySplit = proxyRow.split(":");
            if (proxySplit.length == 2) {
                let [proxyServer, proxyPort] = proxySplit;
                proxies.push({
                    proxyServer,
                    proxyPort
                })
            }
            if (proxySplit.length == 4) {
                let [proxyServer, proxyPort, proxyLogin, proxyPassword] = proxySplit;
                proxies.push({
                    proxyServer,
                    proxyPort,
                    proxyLogin,
                    proxyPassword
                })
            }
        }

        if (proxies.length === 0) {
            this.log('Empty list of valid proxies');
            return [];
        }

        const result: TemplateTask[] = [];

        for (let emailRow of emailList) {
            const emailSplit = emailRow.split(':');
            if (emailSplit.length !== 5) continue;
            const [imapServer, imapPortStr, email, emailLogin, emailPassword] = emailSplit;
            const imapPort = parseInt(imapPortStr)

            const randomProxy = proxies[Math.floor(Math.random() * proxies.length)]

            const randomPerson = this.getRandomName({
                randomGender: true,
                minimumUsernameLength: 10,
                usernameWithANumber: true
            })

            result.push({
                data: {
                    ...randomProxy,
                    imapServer,
                    imapPort,
                    email,
                    emailLogin,
                    emailPassword,
                    ...randomPerson,
                    outputFile
                }
            });
        }

        return result;
    }

    async runTask(task: LinkedinTemplateTask) {
        this.log(JSON.stringify(task));

        async function defaultNavigation(): Promise<void> {
            try {
                await this.page.waitForTimeout((Math.floor(Math.random() * 12) + 5) * 1000);
                // Setting proxy authorization if credentials are provided
                if (task.data.proxyLogin && task.data.proxyPassword) {
                    this.log(`setting proxy authentication ${task.data.proxyLogin}:${task.data.proxyPassword}`);
                    await this.page.authenticate({
                        username: task.data.proxyLogin,
                        password: task.data.proxyPassword,
                    })
                }
            } catch (e) {
                this.log(`err while setting proxy authentication: ${e}`);
                return;
            }

            // redirect to signup page
            try {
                const url: string = 'https://www.linkedin.com';
                this.log(`navigating to ${url}...`);

                await this.page.goto(url);
                await this.delay(3000)

                // Clicking button"Accept" for Cookie if exists
                const [button] = await this.page.$x("//button[contains(., 'Accept')]")
                await button?.click();
                await this.delay(2000)
            } catch (e) {
                this.log(`err while navigating to signup page: ${e}`);
                return;
            }
        }

        async function fillInputAndStartSignup() {
            try {
                const [button] = await this.page.$x("//button[contains(., 'Accept')]")
                await button?.click();

                await this.delay(2000)
                await this.page.goto("https://www.linkedin.com/authwall?trk=qf&original_referer=&sessionRedirect=https%3A%2F%2Fwww.linkedin.com%2F")

                await this.delay(2000)
                await this.page.waitForSelector("#email-or-phone");
                const join_button = await this.page.$("#join-form-submit");

                this.log("filling email")
                await this.page.type('input[id="email-or-phone"]', task.data.email, { delay: Math.random() * 500 + 200 });
                this.log("filling password")
                await this.page.type('input[id="password"]', task.data.password, { delay: Math.random() * 500 + 200 });
                await join_button.click();
                await this.delay(2000)

                await this.page.waitForSelector("#first-name");

                this.log("filling first-name")
                await this.page.type('input[id="first-name"]', task.data.name, { delay: Math.random() * 500 + 200 });
                this.log("filling last-name")
                await this.page.type('input[id="last-name"]', task.data.surname, { delay: Math.random() * 500 + 200 });
            } catch (e) {
                this.log(e)
                return;
            }
        }

        async function phoneVerification() {
            try {
                // verification
                const api_key = "d20b93485d6f90505a4659f22db4189e";
                const service = "tn";
                const low_price_countries = [[0, "ru"], [1, "ua"], [2, "kz"], [6, "id"], [7, "my"], [16, "gb"], [36, "ca"], [73, "br"]];

                // Repeat phone verification while success
                while (1) {
                    // Click continue button
                    const continue_button = await this.page.$("#join-form-submit");
                    await continue_button.click();

                    let activation_id: string = '', phone_number: string = '', randomNumber: number = 0;
                    // Get a vaild phone number of cheapest countries while success
                    while (1) {
                        randomNumber = Math.floor(Math.random() * 8);
                        try {
                            const country = low_price_countries[randomNumber][0];
                            const res = await axios.get(`https://api.grizzlysms.com/stubs/handler_api.php?api_key=${api_key}&action=${"getNumber"}&service=${service}&country=${country}`)
                            if (res.data.split(':')[0] == 'ACCESS_NUMBER') {
                                let _status: string = '';
                                [_status, activation_id, phone_number] = res.data.split(":");
                                break;
                            }
                            console.log(res.status, res.data);
                            await this.delay(1000);
                            continue;
                        } catch (err) {
                            console.log(err?.response?.data)
                            continue;
                        }
                    }

                    // change activation status
                    try {
                        const res = await axios.get(`https://api.grizzlysms.com/stubs/handler_api.php?api_key=${api_key}&action=${"setStatus"}&status=${1}&id=${activation_id}`);
                        console.log(res.data)
                    } catch (err) {
                        console.log(err?.response?.data);
                        continue;
                    }

                    // Get activation status every 3 seconds
                    try {
                        const elementHandle = await this.page.waitForSelector(".challenge-dialog__iframe");
                        const iframe = await elementHandle.contentFrame();
                        await iframe.waitForSelector("#select-register-phone-country");
                        const submitBtn = await iframe.$("#register-phone-submit-button");

                        await iframe.evaluate((code: string) => {
                            const codeSelector = document.querySelector("#select-register-phone-country");
                            if (codeSelector?.["value"])
                                codeSelector["value"] = code;
                            return;
                        }, low_price_countries[randomNumber][1])
                        await iframe.type('input[id="register-verification-phone-number"]', phone_number, { delay: Math.random() * 500 + 200 });
                        await submitBtn.click();
                        await this.delay(2000);
                        await this.page.waitForSelector("#input__phone_verification_pin", { timeout: 5000 });
                    } catch (err) {
                        console.log(err);
                        continue;
                    }

                    // check if new sms is arrived
                    let count: number = 0;
                    while (1) {
                        try {
                            const res = await axios.get(`https://api.grizzlysms.com/stubs/handler_api.php?api_key=${api_key}&action=${"getStatus"}&id=${activation_id}`);
                            if (count < 15) {
                                break;
                            }
                            if (res.data.split(':')[0] == 'STATUS_OK') {
                                const elementHandle = await this.page.waitForSelector(".challenge-dialog__iframe");
                                const iframe = await elementHandle.contentFrame();
                                await iframe.type('input[id="input__phone_verification_pin"]', res.data.split(':')[1], { delay: Math.random() * 500 + 200 });
                                const submitBtn = await iframe.$('#register-phone-submit-button');
                                await submitBtn.click();
                                await this.page.waitForSelector("#typeahead-input-for-country");
                                return;
                            }
                            if (res.data != 'STATUS_WAIT_CODE')
                                break;
                            await this.delay(3000);
                            count++;
                        } catch (err) {
                            this.log("While waiting the ", err?.response?.data);
                            break;
                        }
                    }
                    const close_button = await this.page.$(".challenge-dialog__close");
                    await close_button.click();
                    await this.delay(2000);
                }
            } catch (err) {
                this.log(err);
            }
        }

        async function fillFakeInformation() {
            try {
                const nextBtn1 = await this.page.$("#ember11");
                await nextBtn1.click();

                await this.page.waitForSelector("#typeahead-input-for-title");
                this.page.type("#typeahead-input-for-title", "Software Engineer", { delay: Math.random() * 500 + 200 });
                await this.page.evaluate(() => {
                    const employmentSelector = document.querySelector("#typeahead-input-for-employment-type-picker");
                    if (employmentSelector?.["value"])
                        employmentSelector["value"] = "urn:li:fsd_employmentType:19";
                    return;
                });
                await this.page.type("#typeahead-input-for-company", "CGI", { delay: Math.random() * 500 + 200 });
                const continueBtn = await this.page.$("#ember12");
                await continueBtn.click();

                await this.page.waitForSelector("#ember36");
                const nextBtn2 = await this.page.$("#ember36");
                await nextBtn2.click();

                const cookies = await this.page.cookies();

                this.log('successfully registered the account');
                this.postResultToTable({
                    'Email': task.data.email,
                    'Name': task.data.name,
                    'Password': task.data.password,
                    'Cookies': JSON.stringify(cookies),
                    'Error': '',
                    'Result': true
                });
                this.appendResultToFile(cookies);
                await this.delay(2000);
            } catch (err) {
                this.log("Error while filling fake information");
            }
        }

        this.log("Default Navigation")
        await defaultNavigation.call(this);
        this.log("Filling input and start Signup")
        await fillInputAndStartSignup.call(this)
        this.log("Passing phone verfication");
        await phoneVerification.call(this);
        this.log("filling fake information");
        await fillFakeInformation.call(this);
        await this.delay(30000)
    };

    delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time)
        });
    }

    // Returns custom Chromium arguments
    // This is a place to tune Chromium instance
    getPuppeteerArguments(): string[] {
        return [
            this.task?.data.proxyServer && this.task.data.proxyPort ?
                `--proxy-server=${this.task.data.proxyServer}:${this.task.data.proxyPort}` : '',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--allow-running-insecure-content',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--mute-audio',
            '--no-zygote',
            '--no-xshm',
            '--window-size=1920,1080',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--enable-webgl',
            '--ignore-certificate-errors',
            '--lang=en-US,en;q=0.9',
            '--password-store=basic',
            '--disable-gpu-sandbox',
            '--disable-software-rasterizer',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-infobars',
            '--disable-breakpad',
            '--disable-canvas-aa',
            '--disable-2d-canvas-clip-aa',
            '--disable-gl-drawing-for-tests',
            '--enable-low-end-device-mode',
        ]
    }

    // will be overridden by Template Controller
    postResultToTable(result: object) {

    }

    log(msg: string) {
        console.log(msg)
    }

    // will be overridden by Template Controller
    getRandomName(requirements: GeneratedPersonRequirements): GeneratedPerson {
        return {
            name: '',
            surname: '',
            username: '',
            password: ''
        }
    }

    postFailedStatus(task: TemplateTask, message: string) {
        this.log(message);
        this.postResultToTable({
            'Email': task.data.email,
            'Name': task.data.name,
            'Password': task.data.password,
            'Cookies': '',
            'Error': message,
            'Result': false
        })
    }

    // will be overridden by Template Controller
    async solveCaptcha(captcha: Captcha): Promise<string | object> {
        return "";
    }
}
