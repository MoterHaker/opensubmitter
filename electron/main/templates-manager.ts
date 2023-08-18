/// <reference path="../../src/type.d.ts" />
/// <reference path="../../src/composables/type.d.ts" />
import { app } from 'electron'
import { join } from 'node:path'
import os, {tmpdir} from 'os';
import fs from "fs";
import ts, {ScriptTarget} from "typescript"

import {pathsConfig} from "./pathsconfig";
import { isDevelopmentEnv } from "./functions"
import axios from "axios";

const paths = pathsConfig();

export default class TemplatesManager {

    eventHook = null;
    currentObject: OpenSubmitterTemplateProtocol | null = null;
    selectedTemplateFilePath : string|null = null;
    compiledTemplateFilePath : string|null = null;
    taskThreadsAmount = 10;
    templateSettingsWereSaved: boolean = false;

    private excludeTemplatesFromProduction = [
        'bad-template.ts', //should not even appear in the list
        'test-puppeteer-basic.ts',
        'test-axios.ts',
        'settings-example.ts',
        'imap-example.ts',
        'captcha-solver.ts'
    ];

    setHook(eventHook) {
        this.eventHook = eventHook;
    }

    async selectFile(): Promise<void> {

        if (!this.selectedTemplateFilePath) return;

        //defining the path for compiled template
        this.compiledTemplateFilePath = join(paths.compiledTemplateDir, `index${Math.random()}.cjs`)


        let contentJS = null;
        let contentTS = null;

        try {
            contentTS = fs.readFileSync(this.selectedTemplateFilePath).toString();
        } catch (e) {
            this.eventHook.reply('TaskManager', {type: 'set-template-name-error', error: "Could not open "+this.selectedTemplateFilePath})
            return;
        }

        //merging together template contents with parent controller
        contentTS = contentTS + paths.templateControllerContent;

        try {
            //compiling them into JavaScript
            contentJS = this.tsCompile(contentTS);
        } catch (e) {
            this.eventHook.reply('TaskManager', {type: 'set-template-name-error', error: "Could not compile TypeScript to Javascript"})
            return;
        }

        //setting puppeteer executable path in the parent template controller
        contentJS = contentJS.replace('%PUPPETEER_EXECUTABLE_PATH%', paths.puppeteerExecutablePath());

        try {
            //writing contents to Javascript module file
            fs.writeFileSync(this.compiledTemplateFilePath, contentJS);
        } catch (e) {
            this.eventHook.reply('TaskManager', {type: 'set-template-name-error', error: "Could not write compiled code to file "+this.compiledTemplateFilePath})
            return;
        }


        try {

            //importing compiled module
            let importPath = this.compiledTemplateFilePath
            if (process.platform === 'win32') {
                importPath = `file:///${this.compiledTemplateFilePath}`.replace('\\', '/');
            }

            const { TemplateController } = await import(importPath);

            //creating new template controller which contains the template
            this.currentObject = new TemplateController();

        } catch (e) {
            console.error(`could not open cjs file ${this.compiledTemplateFilePath}: `, e.toString());
            this.eventHook.reply('TaskManager', {type: 'set-template-name-error', error: `Could not import script from template`})
            return;
        }

        if (!this.validateTemplateObject()) return;

        //responding to UI with file name and no errors status
        this.eventHook.reply('TaskManager', { type: 'set-template-name', filename: this.selectedTemplateFilePath })
        this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "" })

        if (!this.currentObject.config) {
            console.log('no config in the template')
            return;
        }
    }


    validateTemplateObject(): boolean {
        const pleaseRefer = ". Please refer to our documentation at https://opensubmitter.com/documentation";
        if (!this.currentObject.config) {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template does not have config property"+pleaseRefer })
            return false;
        }
        if (!this.currentObject.config.name) {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template does not have config.name property"+pleaseRefer })
            return false;
        }
        if (typeof this.currentObject.config.name !== "string") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's property config.name is of incorrect type"+pleaseRefer })
            return false;
        }
        if (!this.currentObject.config.description) {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template does not have config.description property"+pleaseRefer })
            return false;
        }
        if (typeof this.currentObject.config.description !== "string") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's property config.description is of incorrect type"+pleaseRefer })
            return false;
        }
        if (typeof this.currentObject.config.multiThreadingEnabled === "undefined") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template does not have config.multiThreadingEnabled property"+pleaseRefer })
            return false;
        }
        if (typeof this.currentObject.config.multiThreadingEnabled !== "boolean") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's property config.multiThreadingEnabled is of incorrect type"+pleaseRefer })
            return false;
        }
        if (!this.currentObject.config.userSettings) {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template does not have config.userSettings property"+pleaseRefer })
            return false;
        }
        if (typeof this.currentObject.config.userSettings !== "object") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's property config.userSettings is of incorrect type"+pleaseRefer })
            return false;
        }
        if (typeof this.currentObject.generateTasks !== "function") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's generateTasks function is missing"+pleaseRefer })
            return false;
        }
        if (typeof this.currentObject.runTask !== "function") {
            this.eventHook.reply('TaskManager', { type: 'set-template-name-error', error: "Template's runTask function is missing"+pleaseRefer })
            return false;
        }
        return true;
    }

    async readLocal(): Promise<void> {

        //reading parent template controller contents
        const templateParentContent = fs.readFileSync(paths.templateControllerPath).toString().split("//cut")[1];

        //listing templates directory
        const templatesList = fs.readdirSync(paths.templatesDirectory, {withFileTypes: true})
                                .filter(item => {
                                    if (item.isDirectory()) return false;
                                    if (!isDevelopmentEnv() && this.excludeTemplatesFromProduction.indexOf(item.name) !== -1) { console.log('excluding', item); return false }
                                    let ext = item.name.substring(item.name.indexOf('.')+1);
                                    return ['ts','js'].indexOf(ext) !== -1;
                                })
                                .map(item => item.name)

        //temporary dir for compiled templates
        if (!fs.existsSync(paths.temporaryCompiledTemplatesDirectory)) fs.mkdirSync(paths.temporaryCompiledTemplatesDirectory);
        if (!fs.existsSync(paths.temporaryCompiledTemplatesNodeModules)) {
            fs.mkdirSync(paths.temporaryCompiledTemplatesNodeModules)
            fs.mkdirSync(join(paths.temporaryCompiledTemplatesNodeModules, 'axios'))
            fs.mkdirSync(join(paths.temporaryCompiledTemplatesNodeModules, 'puppeteer'))
            fs.writeFileSync(join(paths.temporaryCompiledTemplatesNodeModules, 'axios', 'index.js'),"module.export={}");
            fs.writeFileSync(join(paths.temporaryCompiledTemplatesNodeModules, 'puppeteer', 'index.js'),"module.export={}");
        }

        const result = [];
        for (const templateFile of templatesList) {
            const templatePath = join(paths.templatesDirectory, templateFile);
            let compiledPath = join(paths.temporaryCompiledTemplatesDirectory, `${templateFile}.cjs`);

            //combined Typescript contents of template and its parent controller
            const contentTS = fs.readFileSync(templatePath).toString() + templateParentContent;

            let contentJS;
            try {

                //compiling TS into JS, saving into .cjs file
                contentJS = this.tsCompile(contentTS);
                fs.writeFileSync(compiledPath, contentJS);

                //win32 has its own importing trick
                if (process.platform === 'win32') {
                    compiledPath = `file:///${compiledPath}`.replace('\\', '/');
                }

                //importing compiled module
                const { TemplateController } = await import(compiledPath);
                //creating new template object and getting configuration
                const templateObject = new TemplateController() as OpenSubmitterTemplateProtocol;

                //extracting name and other data from template
                if (templateObject.config && templateObject.config.name) {
                    result.push({
                        name: templateObject.config.name,
                        description: templateObject.config?.description,
                        filePath: templatePath
                    });
                }

            } catch (e) {
                console.log('could not compile: '+e.toString())
            }

        }

        //sending to global Vue
        this.eventHook.reply('Global', {
            type: 'set-template-file-list',
            list: result
        })
    }

    tsCompile(source: string): string {
        return ts.transpileModule(source, { compilerOptions: {
                target: ScriptTarget.ESNext,
                esModuleInterop: true,
                strict: true,
                noEmitOnError: true,
                strictFunctionTypes: true
            }}).outputText;
    }


    saveSettings(): void {
        if (!this.currentObject.config || !this.currentObject.config.userSettings) return; //non-existing config
        let config = {};
        if (fs.existsSync(paths.settingsFile)) {
            try {
                config = JSON.parse(fs.readFileSync(paths.settingsFile).toString())
            } catch (e) {
                //default empty config
            }
        }
        config[this.currentObject.config.name] = [];
        //loop through settings and extract field values
        if (this.currentObject.config && this.currentObject.config.userSettings) {
            for (const setting of this.currentObject.config.userSettings) {
                config[this.currentObject.config.name].push({
                    name: setting.name,
                    value: setting.value,
                    fileName: setting.fileName
                });
            }
        }
        config[this.currentObject.config.name].push({
            name: '__taskThreadsAmount',
            value: this.taskThreadsAmount
        })
        fs.writeFileSync(paths.settingsFile, JSON.stringify(config, null, 2)); //save with pretty-printing
    }

    loadSettings(): void {
        this.templateSettingsWereSaved = false;
        if (!this.currentObject || !this.currentObject.config || !this.currentObject.config.userSettings) return; //non-existing config
        if (!fs.existsSync(paths.settingsFile)) return;
        try {
            const config = JSON.parse(fs.readFileSync(paths.settingsFile).toString());
            if (typeof config[this.currentObject.config.name] === "undefined") return;

            //loop through saved settings
            for (const existingSetting of config[this.currentObject.config.name]) {
                //loop through template settings
                for (const setting of this.currentObject.config.userSettings) {
                    //assign values if names are matching
                    if (existingSetting.name === setting.name) {

                        setting.fileName = existingSetting.fileName;
                        setting.value = existingSetting.value;

                        if (existingSetting.fileName && existingSetting.fileName.length > 0) {
                            this.templateSettingsWereSaved = true;
                        }
                        if (existingSetting.value && existingSetting.value.length > 0) {
                            this.templateSettingsWereSaved = true;
                        }
                    }
                }
                if (existingSetting.name === '__taskThreadsAmount') {
                    this.taskThreadsAmount = existingSetting.value;
                }
            }
        } catch (e) {
            //do nothing
        }
    }

    sendSettings() {
        if (!this.currentObject) {
            console.log('sendTemplateSettings: this.templates.currentObject is null')
            return;
        }
        this.eventHook.reply('TaskManager', {
            type: 'set-template-config',
            config: this.currentObject.config,
            taskThreadsAmount: this.taskThreadsAmount,
            settingsWereSaved: this.templateSettingsWereSaved ? this.templateSettingsWereSaved : false,
            isDevelopmentEnv: isDevelopmentEnv()
        })
    }

    async resetSettings(): Promise<void> {
        await this.selectFile();
        // this.saveSettings();

        if (!this.currentObject.config || !this.currentObject.config.name) return; //non-existing config
        let config = {};
        if (fs.existsSync(paths.settingsFile)) {
            try {
                config = JSON.parse(fs.readFileSync(paths.settingsFile).toString())
            } catch (e) {
                //default empty config
            }
        }
        if (config[this.currentObject.config.name]) {
            delete config[this.currentObject.config.name];
        }
        fs.writeFileSync(paths.settingsFile, JSON.stringify(config, null, 2)); //save with pretty-printing

        this.templateSettingsWereSaved = false;
        this.sendSettings()
    }


    async download(id: number): Promise<void> {

        const templatePath = join(paths.templatesDirectory, `${id}.ts`);
        try {
            const result = await axios.post('https://opensubmitter.com/api/template/download', {
                    id,
                    env: 'prod'
                }, {
                    headers: {
                        Accept: 'Accept: application/json'
                    }
                }
            )
            fs.writeFileSync(templatePath, result.data.contents);
            await this.readLocal();
            await this.eventHook.reply('TaskManager', {
                type: 'switch-to-loaded-template',
                path: templatePath
            })

        } catch (e) {
            console.error('Could not download template: '+e.toString());
            return;
        }
    }

}