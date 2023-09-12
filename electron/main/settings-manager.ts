import fs from "fs";
import ModulesManager from "./modules-manager";
import {pathsConfig} from "./pathsconfig";
import ExecuteManager from "./execute-manager";
import {app} from "electron";

export default class SettingsManager {

    eventHook = null;
    savedSettings: AppSettings = {};
    paths = pathsConfig();
    executer: ExecuteManager;
    private isAppVersionUpdated = false;

    setExecuter(executer: ExecuteManager) {
        this.executer = executer;
    }

    setHook(eventHook): void {
        this.eventHook = eventHook;
    }

    updateAppVersion() {
        if (this.isAppVersionUpdated) return;
        this.isAppVersionUpdated = true;
        if (this.eventHook) {
            this.eventHook.reply('NetworkAPI', {
                type: 'set-version',
                version: app.getVersion()
            })
        }
    }

    async saveAppSettings(data) {
        if (data.antiCaptchaAPIKey) {
            this.savedSettings["antiCaptchaAPIKey"] = data.antiCaptchaAPIKey;
            this.saveSettingsFile();
            await this.checkAntiCaptchaBalance(data.antiCaptchaAPIKey);
        }

        if (data.grizzlySMSAPIKey) {
            this.savedSettings["grizzlySMSAPIKey"] = data.grizzlySMSAPIKey;
            this.saveSettingsFile();
            await this.checkAntiCaptchaBalance(data.antiCaptchaAPIKey);
        }


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
            console.log("got error while setting balance value: ", e.toString());
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

}