import {pathsConfig} from "./pathsconfig";
import {app} from 'electron'
import { utilityProcess } from "electron";
import fs from "fs"
import { delay } from "./functions"

export default class ModulesManager {

    eventHook = null;
    paths = pathsConfig();
    areModulesExtracted = false;
    modulesVersion = '0002';

    setHook(eventHook): void {
        this.eventHook = eventHook;
    }

    /**
     * Extract node_modules, move to a temporary directory where compiled templates will be run from.
     * Doing all this in a separate thread in asarextractor.js to offload the main process.
     */
    async extractNodeModules(): Promise<void> {

        //checking if modules have the latest version already
        if (fs.existsSync(this.paths.compiledTemplateNodeModules) && fs.existsSync(this.paths.compiledTemplateNodeModulesVersion)) {
            const version = fs.readFileSync(this.paths.compiledTemplateNodeModulesVersion).toString();
            if (version === this.modulesVersion) {
                console.log('node_modules version is matching, skipping new copying');
                this.areModulesExtracted = true;
                return;
            }
        }

        if (!this.paths.isDevelopmentEnv()) {

            //extracting app.asar if not extracted yet
            if (!fs.existsSync(this.paths.asarExtractedNodeModules)){

                await new Promise((resolve, reject) => {
                    const child = utilityProcess
                        .fork(this.paths.extractor)
                        .on("spawn", () => {
                            child.postMessage({
                                'type': "prepare-production",
                                "asarExtractedDirectory": this.paths.asarExtractedDirectory,
                                "appPath": app.getAppPath(),
                                "fullModulesPath": this.paths.asarExtractedNodeModules,
                                "targetModulesPath": this.paths.compiledTemplateNodeModules
                            })
                        })
                        .on("exit", (code) => {
                            resolve(code)
                        });
                })
            }

        } else {

            // Developer mode
            // Copying files from local extra/bundled-node-modules/modules

            await new Promise((resolve, reject) => {
                const child = utilityProcess
                    .fork(this.paths.extractor)
                    .on("spawn", () => {
                        child.postMessage({
                            'type': "prepare-development",
                            "sourceModulesPath": this.paths.developmentNodeModules,
                            "targetModulesPath": this.paths.compiledTemplateNodeModules
                        })
                    })
                    .on("exit", (code) => {
                        resolve(code)
                    });
            })

        }
        fs.writeFileSync(this.paths.compiledTemplateNodeModulesVersion, this.modulesVersion);
        this.areModulesExtracted = true;
        console.log('node_modules and browsers are prepared');
    }

    async checkIfModulesAreExtracted(): Promise<boolean> {
        for (let wait = 0;wait < 120; wait++) {
            if (!this.areModulesExtracted) {
                this.eventHook.reply('TaskManager', {
                    type: 'set-running-status',
                    statusData: {
                        status: 'Preparing modules',
                        completed: 0,
                        pending: 0
                    }
                })
                console.log('wating modules extraction..', wait)
                await delay(500);
            } else {
                break;
            }
            if (wait == 119) {
                this.eventHook.reply('TaskManager', {
                    type: 'set-running-status',
                    statusData: {
                        status: 'Failed to copy modules. Too slow computer?',
                        completed: 0,
                        pending: 0
                    }
                })
                return false;
            }
        }
        return true;
    }

}