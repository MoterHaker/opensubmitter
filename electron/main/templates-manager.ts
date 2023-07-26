/// <reference path="../../src/type.d.ts" />
import { app } from 'electron'
import { join } from 'node:path'
import os, {tmpdir} from 'os';
import fs from "fs";
import ts, {ScriptTarget} from "typescript"

import {pathsConfig} from "./pathsconfig";

const paths = pathsConfig();

export default class TemplatesManager {

    eventHook = null;
    currentObject: OpenSubmitterTemplateProtocol | null = null;
    selectedTemplateFilePath : string|null = null;
    compiledTemplateFilePath : string|null = null;

    private excludeTemplatesFromProduction = [
        'bad-template.ts', //should not even appear in the list
        'test-puppeteer.ts',
        'test-axios.ts'
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
                                    if (!paths.isDevelopmentEnv() && this.excludeTemplatesFromProduction.indexOf(item.name) !== -1) { console.log('excluding', item); return false }
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

        const result: LocalTemplateListItem[] = [];
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

        //sending to Vue
        this.eventHook.reply('TaskManager', {
            type: 'template-file-list',
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

    // return {
    //     //variables
    //     currentObject,
    //     selectedTemplateFilePath,
    //     compiledTemplateFilePath,
    //
    //     //methods
    //     readLocal,
    //     selectFile,
    //     tsCompile
    // }

}