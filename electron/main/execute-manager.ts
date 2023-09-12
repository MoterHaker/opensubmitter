import {pathsConfig} from "./pathsconfig";
import { delay } from "./functions"
import {dialog, utilityProcess} from "electron";
import fs from "fs"
import TemplatesManager from "./templates-manager";
import ModulesManager from "./modules-manager";
import ExportManager from "./export-manager";

const paths = pathsConfig();

export default class ExecuteManager {

    eventHook = null;
    templates : TemplatesManager | null = null;
    modulesManager: ModulesManager | null = null;
    exportManager: ExportManager
    currentTasks: TemplateTask[] = [];
    threads: TemplateControllerChild[] = [];
    isRunningAllowed = true;
    freedThreadNumbers: number[] = [];
    puppeteerHeadOn = false;
    userSettings: UserSetting[] = []
    protected savedSettings: AppSettings = {};
    latestSharedData: any = null;

    setHook(eventHook): void {
        this.eventHook = eventHook;
    }

    setTemplateManager(manager: TemplatesManager): void {
        this.templates = manager;
    }

    setModulesManager(manager: ModulesManager): void {
        this.modulesManager = manager;
    }

    setAppSettings(settings: AppSettings): void {
        this.savedSettings = settings;
    }

    async childProcessMessageHandler(child: UtilityProcess, message: MessageWithType): Promise<void> {

        if (!this.isRunningAllowed) {
            //any updates don't matter in this state
            return;
        }

        for (const thread of this.threads) {
            if (thread.child.pid === child.pid) {

                switch (message.type) {
                    case 'log-update':
                        thread.textStatus = message.data.message;
                        this.eventHook.reply('TaskManager', {
                            type: 'add-log-message',
                            message: 'Thread '+thread.threadNumber + ": " + message.data.message
                        })
                        break;

                    case 'post-result-to-table':
                        this.eventHook.reply('TaskManager', {
                            type: 'post-result-to-table',
                            result: message.data
                        })
                        break;

                    case 'save-results-to-storage':
                        this.exportManager.store(message.data)
                        break;

                    case 'broadcast-message-to-threads':
                        this.latestSharedData = message.data;
                        this.broadcastMessageToThreads(message.data);
                        break;
                }

                return;
            }
        }
    }

    postThreadStatuses(): void {
        const data: ThreadStatus[] = [];
        for (const thread of this.threads) {
            data.push({
                thread: thread.threadNumber,
                status: thread.textStatus
            })
        }
        this.eventHook.reply('TaskManager', {
            type: 'set-thread-statuses',
            statuses: data
        })
    }

    addToParentLog(message): void {
        console.log(message);
        this.eventHook.reply('TaskManager', {
            type: 'add-log-message',
            message: message
        })
    }

    async runOpenedTemplate(): Promise<void> {

        this.latestSharedData = null;
        this.templates.saveSettings();
        console.log("\n\n\n======NEW RUN======\n");

        if (!await this.modulesManager.checkIfModulesAreExtracted()) {
            return;
        }
        this.exportManager = new ExportManager();

        this.isRunningAllowed = true;
        this.eventHook.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Generating tasks',
                completed: 0,
                pending: 0
            }
        })
        this.addToParentLog('Generating tasks..');

        try {
            this.currentTasks = await this.templates.currentObject.generateTasks();
        } catch (e) {
            this.addToParentLog('Template error: '+e.toString())
            this.eventHook.reply('TaskManager', {
                type: 'set-running-status',
                statusData: {
                    status: 'Template error: '+e.toString(),
                    completed: 0,
                    pending: 0
                }
            })
            return;
        }
        // console.log('this.currentTasks ' + JSON.stringify(this.currentTasks));

        this.eventHook.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Running tasks',
                completed: 0,
                active: this.threads.length,
                pending: this.currentTasks.length
            }
        })

        let completedTasks = 0;
        let threadQueueNumber = 1;


        while (true) {

            if (!this.isRunningAllowed) {
                break;
            }

            this.postThreadStatuses();


            if (this.threads.length >= this.templates.taskThreadsAmount) {
                await delay(1000);
                continue;
            }

            const task = this.currentTasks.length === 0 ? null : this.currentTasks.pop();
            if (!task) {
                console.log('no more tasks left')
                if (this.threads.length > 0) {
                    console.log('some threads are still running: ', this.threads.length);
                    await delay(500);
                    continue;
                } else {
                    this.addToParentLog('All threads have finished their work')
                    break;
                }
            }


            try {
                const child = utilityProcess
                    .fork(this.templates.compiledTemplateFilePath)
                    .on("spawn", () => {

                        const taskMessage: TaskMessage = {
                            'type': "start-task",
                            "pid": child.pid,
                            "task": task,
                            "config": this.templates.currentObject.config ? this.templates.currentObject.config : null,
                            "antiCaptchaAPIKey": this.savedSettings.antiCaptchaAPIKey,
                            "puppeteerHeadOn": this.puppeteerHeadOn,
                            "electronAssetsDirectory": this.modulesManager.paths.electronAssets,
                            "latestSharedData": this.latestSharedData
                        }
                        if (typeof child.postMessage === "function") {
                            // sometimes fires "undefined" postMessage alert
                            child.postMessage(taskMessage)
                        }
                    })
                    .on('message', async (data) => {
                        await this.childProcessMessageHandler(child, data)
                    })
                    .on("exit", (code) => {
                        this.threads = this.threads.filter(thread => {
                            if (thread.child.pid !== child.pid) {
                                return true;
                            } else {
                                this.freedThreadNumbers.push(thread.threadNumber);
                                return false;
                            }
                        });
                        // console.log("exiting utilityProcess pid " + child.pid)
                        completedTasks++;
                        this.eventHook.reply('TaskManager', {
                            type: 'set-running-status',
                            statusData: {
                                status: 'Running tasks',
                                completed: completedTasks,
                                active: this.threads.length,
                                pending: this.currentTasks.length
                            }
                        })
                    });

                let newThreadNumber = this.freedThreadNumbers.pop();
                if (typeof newThreadNumber === "undefined") {
                    newThreadNumber = threadQueueNumber;
                    threadQueueNumber++;
                    // console.log(`got newThreadNumber from threadQueueNumber, newThreadNumber = ${newThreadNumber}, threadQueueNumber = ${threadQueueNumber}`)
                } else {
                    // console.log('popped from freedThreadNumbers: ', newThreadNumber)
                }

                // console.log('adding thread with number ',newThreadNumber)

                this.threads.push({
                    child,
                    threadNumber: newThreadNumber,
                    textStatus: "Started thread"
                })

                this.eventHook.reply('TaskManager', {
                    type: 'set-running-status',
                    statusData: {
                        status: 'Running tasks',
                        completed: completedTasks,
                        active: this.threads.length,
                        pending: this.currentTasks.length
                    }
                })

            } catch (e) {
                this.addToParentLog("Could not start thread process: "+e.toString())
            }

        }

        //export data if there are export settings
        this.exportData()


        this.eventHook.reply('TaskManager', {
            type: 'set-running-status',
            statusData: {
                status: 'Job complete',
                completed: completedTasks,
                active: this.threads.length,
                pending: this.currentTasks.length
            }
        })

        this.addToParentLog(`Done! Completed ${completedTasks} tasks`);
    }

    broadcastMessageToThreads(data: any) {
        for (const thread of this.threads) {
            if (typeof thread.child.postMessage === "function") {
                // sometimes fires "undefined" postMessage alert
                thread.child.postMessage({
                    type: 'receive-broadcast-data',
                    data
                })
            }
        }
    }

    exportData() {
        const exportSetting = this.userSettings.find(setting => setting.type === 'ExportFile');
        if (!exportSetting) return;
        const exportCount = this.exportManager.export(exportSetting.value as ExportFormat, exportSetting.fileName)
        this.eventHook.reply('TaskManager', {
            type: 'notify-export-completed',
            exportedRows: exportCount
        })
    }

    async exportResultsToAnotherFile(data) {
        const files: Electron.SaveDialogReturnValue = await dialog.showSaveDialog({properties: ['showOverwriteConfirmation']});
        if (!files || files.canceled) {
            return;
        }
        const exportedRows = this.exportManager.export(
            data.format,
            files.filePath);
        this.eventHook.reply('TaskManager', {
            type: 'notify-export-completed',
            exportedRows
        })
    }

    killThreads(): void {
        for (const thread of this.threads) {
            thread.child.kill()
        }
        this.threads = [];
    }

}