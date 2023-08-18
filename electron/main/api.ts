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


    startListening(): void {
        this.readAppSettings();
        this.executer.setTemplateManager(this.templates);
        this.executer.setModulesManager(this.modulesManager);
        ipcMain.on('TM', async(e, data) => {
            if (!data.type) return;
            this.eventHook = e;
            this.templates.setHook(e);
            this.modulesManager.setHook(e);
            this.executer.setHook(e);
            switch (data.type) {

                case 'select-existing-template':
                    this.templates.selectedTemplateFilePath = data.fileName;
                    await this.templates.selectFile();
                    this.templates.loadSettings();
                    this.templates.sendSettings();
                    break;

                case 'select-template-dialog':
                    await this.openTemplateDialog();
                    break;

                case 'run-opened-file':
                    const parameters: RunTemplateParameters = data;
                    this.setTemplateUserSettings(parameters.settings);
                    if (this.templates.currentObject.config.multiThreadingEnabled) {
                        this.templates.taskThreadsAmount = parameters.threadsNumber;
                    } else {
                        this.templates.taskThreadsAmount = 1;
                    }
                    this.executer.puppeteerHeadOn = parameters.puppeteerHeadOn;
                    await this.executer.runOpenedTemplate();
                    break;

                case 'select-file-for-template-settings':
                    await this.selectFileForTemplateSettings(data);
                    break;

                case 'stop-job':
                    this.executer.isRunningAllowed = false;
                    this.executer.killThreads();
                    break;

                case 'read-local-templates':
                    await this.templates.readLocal();
                    break;

                case 'reset-template-settings':
                    await this.templates.resetSettings();
                    break;

                case 'save-settings':
                    await this.saveAppSettings(data);
                    break;

                case 'check-anti-captcha-balance':
                    await this.checkAntiCaptchaBalance(data.key)
                    break;

                case 'get-settings':
                    this.readAppSettings();
                    break;

                case 'download-template':
                    await this.templates.download(data.id)
                    break;



            }

        });
        this.modulesManager.extractNodeModules();
    }


    async selectFileForTemplateSettings(data) {
        if (data.dialogType === 'open') {
            const files: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({properties: ['openFile']});
            if (!files || files.canceled) {
                return;
            } else {
                this.templates.currentObject.config.userSettings[data.index]["fileName"] = files.filePaths[0];
            }
        }
        if (data.dialogType === 'save') {
            const files: Electron.SaveDialogReturnValue = await dialog.showSaveDialog({properties: ['showOverwriteConfirmation']});
            if (!files || files.canceled) {
                return;
            } else {
                this.templates.currentObject.config.userSettings[data.index]["fileName"] = files.filePath;
            }
        }
        this.eventHook.reply('TaskManager', {
            type: 'set-template-config',
            config: this.templates.currentObject.config,
            taskThreadsAmount: this.templates.taskThreadsAmount
        })
    }

    setTemplateUserSettings(data) {
        this.templates.currentObject.config.userSettings = data;
    }

    async openTemplateDialog() {
        const files: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({ properties: ['openFile'] });
        if (!files || files.canceled) {
            console.log('canceled file opening')
            return;
        }

        this.templates.selectedTemplateFilePath = files.filePaths[0];
        await this.templates.selectFile();
        this.templates.loadSettings();
        this.templates.sendSettings();
    }


    readAppSettings() {
        if (!fs.existsSync(this.paths.settingsFile)) return;
        try {
            const config = JSON.parse(fs.readFileSync(this.paths.settingsFile).toString());
            if (typeof config["___settings"] === "undefined") return;
            this.savedSettings = config["___settings"];
            this.executer.setAppSettings(this.savedSettings);
            if (this.eventHook) {
                this.eventHook.reply('Settings', {
                    type: 'set-settings',
                    settings: this.savedSettings
                })
            }
        } catch (e) {
            //do nothing
        }
    }

    async saveAppSettings(data) {
        this.savedSettings["antiCaptchaAPIKey"] = data.antiCaptchaAPIKey;
        this.saveSettingsFile();
        await this.checkAntiCaptchaBalance(data.antiCaptchaAPIKey);
    }

    async checkAntiCaptchaBalance(key: string) {
        const ac = require("@antiadmin/anticaptchaofficial");
        ac.setAPIKey(key);
        try {
            const balance = await ac.getBalance();
            this.eventHook.reply('Settings', {
                type: 'set-balance-value',
                balance
            })

        } catch (e) {
            this.eventHook.reply('Settings', {
                type: 'set-key-error',
                message: e.toString()
            })
            console.log("got error: ", e.toString());
        }
    }

    saveSettingsFile() {
        let config = {};
        if (fs.existsSync(this.paths.settingsFile)) {
            try {
                config = JSON.parse(fs.readFileSync(this.paths.settingsFile).toString())
            } catch (e) {
                //default empty config
            }
        }
        config["___settings"] = this.savedSettings;
        fs.writeFileSync(this.paths.settingsFile, JSON.stringify(config, null, 2)); //save with pretty-printing
        this.executer.setAppSettings(this.savedSettings);
    }

}

export default InternalAPI