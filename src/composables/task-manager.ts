import { defineStore } from 'pinia'
import { useAPI } from "./api"
import {ref, watch} from "vue";
import { ipcRenderer } from 'electron'
import {useTitleStore} from "./titles";
import {useRouter} from "vue-router";


export const useTaskManagerStore = defineStore('taskManager', () => {

    const router = useRouter();

    const templateSource = ref('existing')
    const selectedTemplateFilename = ref('')
    const localTemplatesList = ref<PublicTemplate[]>([])
    const isLocalTemplatesUpdated = ref(false);
    const isRunningBlocked = ref(true);
    const userSettings = ref<UserSetting[]>([]);
    const templateConfig = ref<TemplateConfig | null>(null);
    const templateError = ref('');
    const interfaceMode = ref<TaskManagerInterfaceMode>('settings');
    const isJobRunning = ref(false);
    const taskStatusData = ref<TaskStatusUpdate | null>( null);
    const textLogString = ref('')
    const resultTableHeader = ref<ResultTableRow[] | null>(null);
    const resultsData = ref<ResultTableRow[][]>([]);
    const threadStatuses = ref<ThreadStatus[]>([])
    const threadsNumber = ref('10');
    const threadsError = ref('');
    const isTemplateSettingsResetAvailable = ref(false);
    const isDevelopmentEnv = ref(false)
    const hasPuppeteerInCapabilities = ref(false);
    const puppeteerHeadOnMode = ref(false)
    const hasExportUserSetting = ref(false);
    const exportFormat = ref<ExportFormat>('CSV');
    const isExporting = ref(false);
    const exportedCount = ref(0);

    watch(() => selectedTemplateFilename.value, () => {
        if (selectedTemplateFilename.value.length > 0) {
            ipcRenderer.send('TM', {type: 'select-existing-template', fileName: selectedTemplateFilename.value});
        }
    })

    const selectTemplateByName = (templateName: string): void => {
        for (const templateRow of localTemplatesList.value) {
            if (templateRow.name == templateName && templateRow.filePath) {
                selectedTemplateFilename.value = templateRow.filePath
                return;
            }
        }
    }

    const selectTemplateByPath = (path: string): void => {
        for (const templateRow of localTemplatesList.value) {
            if (templateRow.filePath?.indexOf(path) !== -1 && templateRow.filePath) {
                selectedTemplateFilename.value = templateRow.filePath
                return;
            }
        }
    }

    const resetTemplate = () : void => {
        selectedTemplateFilename.value = '';
        isRunningBlocked.value = true;
        templateConfig.value = null;
        userSettings.value = [];
        taskStatusData.value = null;
        textLogString.value = '';
        interfaceMode.value = 'settings';
        threadStatuses.value = [];
        resultTableHeader.value = null;
        resultsData.value = [];
        hasPuppeteerInCapabilities.value = false;
    }

    const restartJob = () : void => {
        interfaceMode.value = 'settings';
        reloadSelectedTemplateSettings();
    }

    const reloadSelectedTemplateSettings = (): void => {
        if (selectedTemplateFilename.value.length > 0) {
            ipcRenderer.send('TM', {type: 'select-existing-template', fileName: selectedTemplateFilename.value});
        } else {
            resetTemplate()
        }
    }

    function switchSourceToggler(value: string) {
        if (value) templateSource.value = 'file';
        else {
            templateSource.value = 'existing';

            // Clear user settings UI, so nothing is left
            // from custom template file
            if (!isSelectedTemplateExistsInTheList()) {
                selectedTemplateFilename.value = '';
                resetTemplate();
            }
        }
        reloadSelectedTemplateSettings();
    }

    function isSelectedTemplateExistsInTheList(): boolean {
        const found = localTemplatesList.value.find(el => el.filePath == selectedTemplateFilename.value);
        return typeof found !== "undefined";
    }


    function validateUserSettings(type?: UserSettingsInput, index?: number) {
        let isEverythingChecked = true;
        const isSilentChecking = typeof type === "undefined" && typeof index === "undefined"
        if (isSilentChecking) {
            hasExportUserSetting.value = false;
        }
        for (const userSettingIndex in userSettings.value) {
            const userSetting : UserSetting = userSettings.value[userSettingIndex];
            if (!isSilentChecking) {
                //check exactly this input
                if (parseInt(userSettingIndex) === index) {
                    if (userSetting.required && userSetting.required === true) {
                        if (validateInput(userSetting)) {
                            userSetting.errorString = null;
                        } else {
                            userSetting.errorString = "Required field";
                        }
                    }
                    validateUserSettings(); //recheck everything silently
                }
            } else {
                //check all fields silently
                if (!validateInput(userSetting) || !validateThreads()) {
                    isEverythingChecked = false;
                } else {
                    userSetting.errorString = null;
                }
                if (userSetting.type === 'ExportFile') {
                    hasExportUserSetting.value = true;
                    exportFormat.value = userSetting.value as ExportFormat;
                }
            }

        }

        //results of silent mode
        if (isSilentChecking) {
            isRunningBlocked.value = !isEverythingChecked;

            // update user settings at background
            ipcRenderer.send('TM', {
                type: 'update-template-user-settings',
                settings: deepCopy(userSettings.value)
            })

        }

    }


    function validateInput(setting: UserSetting) {
        if (typeof setting.required === "undefined") {
            return true;
        }
        if (typeof setting.required !== "undefined" && setting.required === false) {
            return true;
        }
        switch (setting.type) {

            case 'Textarea':
            case 'TextInput':
                if (setting.value) {
                    return (setting.value as String).length > 0;
                }
                break;

            case 'OutputFile':
            case 'SourceFile':
            case 'ExportFile':
                if (setting.fileName) {
                    if (setting.fileName!.length > 0) {
                        return true;
                    } else {
                        return false;
                    }
                }
                break;
        }
    }


    function validateThreads() {
        if (parseInt(threadsNumber.value) === 0) {
            threadsError.value = 'Invalid value';
            return false;
        } else {
            threadsError.value = '';
            return true;
        }
    }

    function runTemplateIPC() {
        if (isRunningBlocked.value) {
            console.log('running blocked');
            return;
        }

        const settings = deepCopy(userSettings.value);

        useTitleStore().subtitle = 'Running "'+(templateConfig.value as TemplateConfig).name+"\""
        const runParameters: RunTemplateParameters = {
            type: 'run-opened-file',
            threadsNumber: parseInt(threadsNumber.value),
            puppeteerHeadOn: puppeteerHeadOnMode.value,
            settings
        }
        ipcRenderer.send('TM', runParameters);
    }

    function deepCopy(obj: any, seen = new WeakMap()) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // Handle circular references
        if (seen.has(obj)) {
            return seen.get(obj);
        }

        let copy: any = Array.isArray(obj) ? [] : {};

        // Store the copy in the seen map to handle circular references
        seen.set(obj, copy);

        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                copy[key] = deepCopy(obj[key], seen);
            }
        }

        return copy;
    }

    function openTemplateIPC() {
        ipcRenderer.send('TM', {type: 'select-template-dialog'})
    }
    function exportResultsIPC() {
       exportedCount.value = 0;
        ipcRenderer.send('TM', {type: 'export-result-to-another-file', format: exportFormat.value })
    }
    function resetTemplateSettingsIPC() {
        isTemplateSettingsResetAvailable.value = false;
        ipcRenderer.send('TM', {type: 'reset-template-settings'})
    }
    function stopJobIPC() {
        useTitleStore().subtitle = "Run templates"
        isJobRunning.value = false;
        ipcRenderer.send('TM', {type: 'stop-job'});
    }

    ipcRenderer.on('TaskManager', (e, data) => {
        switch (data.type) {
            case 'set-template-name':
                resetTemplate()
                selectedTemplateFilename.value = data.filename;
                validateUserSettings()
                break;

            case 'set-template-config':
                if (templateError.value.length > 0) return;
                templateConfig.value = data.config;
                threadsNumber.value = data.taskThreadsAmount;
                if (data.config.userSettings) {
                    userSettings.value = data.config.userSettings;
                    validateUserSettings()
                }
                if (data.config.resultTableHeader) {
                    resultTableHeader.value = data.config.resultTableHeader;
                }
                if (data.settingsWereSaved) {
                    isTemplateSettingsResetAvailable.value = true;
                }
                isDevelopmentEnv.value = data.isDevelopmentEnv;
                if (data.config.capabilities && data.config.capabilities.indexOf('puppeteer') !== -1) {
                    hasPuppeteerInCapabilities.value = true;
                } else {
                    hasPuppeteerInCapabilities.value = false;
                }
                break;

            case 'set-template-name-error':
                if (data.error && data.error.length > 0) {
                    resetTemplate()
                }
                templateError.value = data.error;
                break;

            case 'set-running-status':
                interfaceMode.value = 'running';
                taskStatusData.value = data.statusData;
                if (data.statusData.status === 'Job complete' || data.statusData.status.indexOf('Template error') !== -1) {
                    isJobRunning.value = false;
                    useTitleStore().subtitle = "Run templates"
                } else {
                    isJobRunning.value = true;
                }
                break;

            case 'add-log-message':
                textLogString.value = textLogString.value + data.message + "\n";
                break;

            case 'set-thread-statuses':
                threadStatuses.value = data.statuses;
                break;

            case 'post-result-to-table':
                resultsData.value.push(data.result as ResultTableRow[])
                break;

            case 'switch-to-loaded-template':
                router.push('/dashboard');
                selectTemplateByName(data.name);
                break;

            case 'notify-export-completed':
                isExporting.value = false;
                exportedCount.value = parseInt(data.exportedRows);
                break;

        }

    })

    return {
        // refs:
        templateSource,
        selectedTemplateFilename,
        localTemplatesList,
        isLocalTemplatesUpdated,

        isRunningBlocked,
        userSettings,
        templateConfig,
        templateError,
        interfaceMode,
        isJobRunning,
        taskStatusData,
        textLogString,
        resultTableHeader,
        resultsData,
        threadStatuses,
        threadsNumber,
        threadsError,
        isTemplateSettingsResetAvailable,
        isDevelopmentEnv,
        hasPuppeteerInCapabilities,
        hasExportUserSetting,
        exportFormat,
        puppeteerHeadOnMode,
        isExporting,
        exportedCount,

        // methods:
        selectTemplateByName,
        selectTemplateByPath,
        resetTemplate,
        restartJob,
        switchSourceToggler,
        validateUserSettings,

        //IPC
        runTemplateIPC,
        openTemplateIPC,
        exportResultsIPC,
        resetTemplateSettingsIPC,
        stopJobIPC
    }
})