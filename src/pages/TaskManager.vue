<template>
    <div>
        <div v-if="interfaceMode == 'running'">

            {{ taskStatusData?.status }} {{ taskStatusData?.status == 'Running tasks' ? ' ('+taskStatusData?.pending + ' pending, ' + taskStatusData?.completed + ' completed)'  : ''}}
            <progress-bar :percents="progressComputed"/>
            <div class="run-btn">
                <btn label="Restart" @click="resetManager" :disabled="isJobRunning" class="btn-row"/>
                <btn label="Stop" @click="stopJobIPC" :disabled="!isJobRunning" class="btn-row"/>
            </div>
        </div>
        <div v-if="interfaceMode == 'settings'">
            <div class="textfield-button">
                <div>Template file path</div>
                <Textfield v-model="fileName" style="width:100%" :errorMessage="templateError"/>
                <btn label="Open Template" @click="openTemplateIPC"/>
            </div>
            <div v-if="userSettings.length > 0 && templateConfig">
                <div class="hg2 padding20_0px">{{templateConfig?.name}}</div>
            </div>
            <div v-for="(setting, index) in userSettings as UserSetting[]" :key="index" class="mtop10">
                <div v-if="['SourceFileTaskPerLine'].indexOf(setting.type) !== -1" class="textfield-button">
                    <div>{{setting.title}}</div>
                    <Textfield v-model="setting.fileName" @update:modelValue="validateUserSettings(setting.type, index)" :error-message="setting.errorString" style="width:100%"/>
                    <btn label="Select File" @click="selectFileForTemplateIPC('open', index)"/>
                </div>
                <div v-if="['OutputFile'].indexOf(setting.type) !== -1" class="textfield-button">
                    <div>{{setting.title}}</div>
                    <textfield v-model="setting.fileName" @update:modelValue="validateUserSettings(setting.type, index)" :error-message="setting.errorString" style="width:100%"/>
                    <btn label="Select File" @click="selectFileForTemplateIPC('save', index)"/>
                </div>
            </div>
            <div class="run-btn">
                <btn label="Run template" :disabled="isRunningBlocked" @click="runTemplateIPC"/>
            </div>
        </div>

        <div class="subtitle mtop20" height="200">Job logs:</div>
        <text-log v-model="textLogString" class="mtop10"/>
    </div>
</template>

<script setup lang="ts">
/// <reference path="../../src/interface.d.ts" />
import Btn from "../components/Btn.vue";
import {computed, ComputedRef, ref} from 'vue'
import { ipcRenderer } from 'electron'
import Textfield from "../components/Textfield.vue";
import ProgressBar from "../components/ProgressBar.vue";
import TextLog from "../components/TextLog.vue";

const fileName = ref('')
const isRunningBlocked = ref(true);
const userSettings = ref([]);
const templateConfig = ref<TemplateConfig | null>(null);
const templateError = ref('');
const interfaceMode = ref<TaskManagerInterfaceMode>('settings');
const isJobRunning = ref(false);
const taskStatusData = ref<TaskStatusUpdate | null>({
    status: 'Testing',
    completed: 10,
    pending: 50
});
const textLogString = ref('')


function validateUserSettings(type?: UserSettingsInput, index?: number) {
    let isEverythingChecked = true;
    for (const userSettingIndex in userSettings.value) {
        const userSetting : UserSetting = userSettings.value[userSettingIndex];
        if (typeof type !== "undefined" && typeof index !== "undefined") {
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
            if (!validateInput(userSetting)) {
                isEverythingChecked = false;
            } else {
                userSetting.errorString = null;
            }
        }
    }

    //results of silent mode
    if (typeof type === "undefined" && typeof index === "undefined") {
        isRunningBlocked.value = !isEverythingChecked;
    }

}
function validateInput(setting: UserSetting) {
    switch (setting.type) {
        case 'OutputFile':
        case 'SourceFileTaskPerLine':
            console.log('validating setting.fileName', setting.fileName);
            //TODO check in internal API that file exists
            if (typeof setting.required === "undefined") {
                return true;
            }
            if (setting.required && setting.required === false) {
                return true;
            }
            if (setting.fileName) {
                return setting.fileName!.length > 0; // || typeof setting.required  && setting.required === false
            }
            break;
    }
}

const progressComputed: ComputedRef<number> = computed(() => {
    if (typeof taskStatusData.value?.completed === "undefined" || typeof taskStatusData.value?.pending === "undefined") return 0;
    const totalTasks = taskStatusData.value!.completed + taskStatusData.value!.pending;
    if (totalTasks === 0) return 0;
    return 100 - Math.round(taskStatusData.value!.pending / totalTasks * 100);
})


function runTemplateIPC() {
    if (isRunningBlocked.value) {
        console.log('running blocked');
        return;
    }
    ipcRenderer.send('TM', { type: 'run-opened-file' });
}
function openTemplateIPC() {
    ipcRenderer.send('TM', {type: 'select-template-dialog'})
}

function selectFileForTemplateIPC(type : FileOpenDialogType, index: number) {
    ipcRenderer.send('TM', {
        type: 'select-file-for-template-settings',
        dialogType: type,
        index
    });
}
function resetManager() {
    fileName.value = '';
    isRunningBlocked.value = true;
    templateConfig.value = null;
    userSettings.value = [];
    taskStatusData.value = null;
    textLogString.value = '';
    interfaceMode.value = 'settings';
}
function stopJobIPC() {
    isJobRunning.value = false;
    ipcRenderer.send('TM', {type: 'stop-job'});
}

ipcRenderer.on('TaskManager', (e, data) => {
    switch (data.type) {
        case 'set-template-name':
            fileName.value = data.filename;
            validateUserSettings()
            break;

        case 'set-template-config':
            console.log('set-template-config message', data);
            templateConfig.value = data.config;
            if (data.config.userSettings) {
                userSettings.value = data.config.userSettings;
                validateUserSettings()
            }
            break;

        case 'set-template-name-error':
            templateError.value = data.error;
            break;

        case 'set-running-status':
            interfaceMode.value = 'running';
            taskStatusData.value = data.statusData;
            if (data.statusData.status === 'Job complete') {
                isJobRunning.value = false;
            } else {
                isJobRunning.value = true;
            }
            break;

        case 'add-log-message':
            textLogString.value = textLogString.value + data.message + "\n";
            break;
    }

})


ipcRenderer.on('TM-set-template-config', (e, data) => {

});
ipcRenderer.on('TM-set-template-name-error', (e, errorString: string) => {
    templateError.value = errorString;
})
</script>

<style lang="less">
@import '../assets/css/vars.less';

.run-btn {
    display: table;
    margin: 50px auto 0;
    max-width: 200px;
}
.btn-row {
    display: inline-block !important;
    margin-right: 5px;
    margin-left: 5px;
    width: auto !important;

}

</style>
