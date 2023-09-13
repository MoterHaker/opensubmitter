/// <reference path="../../templates/type.d.ts" />
/// <reference path="../../src/type.d.ts" />
import {app, ipcMain} from 'electron'
import { join } from 'node:path'
const { dialog } = require('electron')

import ts, {ScriptTarget} from "typescript"
import { utilityProcess } from "electron";
import fs from "fs"
import os, {tmpdir} from 'os';
import ac from "@antiadmin/anticaptchaofficial"
import axios from "axios";
import {pathsConfig} from "./pathsconfig";
import TemplatesManager from "./templates-manager";
import ModulesManager from "./modules-manager";
import ExecuteManager from "./execute-manager";
import SettingsManager from "./settings-manager";


class InternalAPI {

    // isRunningAllowed = true;
    // taskThreadsAmount = 10;
    eventHook = null;
    // freedThreadNumbers: number[] = [];

    protected savedSettings: AppSettings = {};
    protected paths = pathsConfig();
    protected templates: TemplatesManager = new TemplatesManager();
    protected modulesManager: ModulesManager = new ModulesManager();
    protected executer: ExecuteManager = new ExecuteManager();
    protected settings: SettingsManager = new SettingsManager();


    startListening(): void {
        this.executer.setTemplateManager(this.templates);
        this.executer.setModulesManager(this.modulesManager);
        this.settings.setExecuter(this.executer);
        this.settings.readAppSettings();
        ipcMain.on('TM', async(e, data) => {
            if (!data.type) return;
            this.eventHook = e;
            this.templates.setHook(e);
            this.modulesManager.setHook(e);
            this.executer.setHook(e);
            this.settings.setHook(e);
            this.settings.updateAppVersion();
            switch (data.type) {

                case 'select-existing-template':
                    this.templates.selectedTemplateFilePath = data.fileName;
                    await this.templates.selectFile();
                    this.templates.loadSettings();
                    this.templates.sendSettings();
                    break;

                case 'select-template-dialog':
                    await this.templates.openTemplateDialog();
                    break;

                case 'run-opened-file':
                    const parameters: RunTemplateParameters = data;
                    this.templates.currentObject.config.userSettings = parameters.settings;
                    if (this.templates.currentObject.config.multiThreadingEnabled) {
                        this.templates.taskThreadsAmount = parameters.threadsNumber;
                    } else {
                        this.templates.taskThreadsAmount = 1;
                    }
                    this.executer.puppeteerHeadOn = parameters.puppeteerHeadOn;
                    this.executer.userSettings = parameters.settings;
                    await this.executer.runOpenedTemplate();
                    break;

                case 'update-template-user-settings':
                    this.templates.currentObject.config.userSettings = data.settings;
                    break;

                case 'select-file-for-template-settings':
                    await this.templates.selectFileForTemplateSettings(data);
                    break;

                case 'stop-job':
                    this.executer.isRunningAllowed = false;
                    this.executer.killThreads();
                    break;

                case 'read-local-templates':
                    if (!this.paths.isNodeModulesExtracted) {
                        this.extractNodeModulesAndReadTemplates();
                        return
                    }
                    await this.templates.readLocal();
                    break;

                case 'reset-template-settings':
                    await this.templates.resetSettings();
                    break;

                case 'save-settings':
                    await this.settings.saveAppSettings(data);
                    break;

                case 'check-anti-captcha-balance':
                    await this.settings.checkAntiCaptchaBalance(data.key)
                    break;

                case 'check-grizzly-sms-balance':
                    await this.settings.checkSMSGrizzlyBalance(data.key)
                    break;

                case 'get-settings':
                    this.settings.readAppSettings();
                    break;

                case 'download-template':
                    await this.templates.download(data.id)
                    break;

                case 'export-result-to-another-file':
                    await this.executer.exportResultsToAnotherFile(data);
                    break;



            }

            this.extractNodeModulesAndReadTemplates();

        });



    }

    extractNodeModulesAndReadTemplates() {
        this.modulesManager.extractNodeModules().then(() => {
            this.paths.isNodeModulesExtracted = true;
            this.templates.readLocal()
        });
    }




}

export default InternalAPI