<template>
    <div>
        <div v-if="interfaceMode == 'running'">

            {{ taskStatusData?.status }} {{ taskStatusData?.status == 'Running tasks' ? ' ('+taskStatusData?.pending + ' pending, '+taskStatusData?.active + ' active, ' + taskStatusData?.completed + ' completed)'  : ''}}
            <div class="progress-block">
                <progress-bar :percents="progressComputed"/>
                <btn label="Restart" @click="resetManager" v-if="!isJobRunning" class="btn-row"/>
                <btn label="Stop" @click="stopJobIPC" v-if="isJobRunning" class="btn-row"/>
            </div>

            <div class="subtitle mtop20" height="200">Thread Statuses:</div>
            <thread-statuses class="mtop10" :statuses="threadStatuses" />
            <div class="subtitle mtop20" height="200">Job logs:</div>
            <text-log v-model="textLogString" class="mtop10"/>
            <div class="run-btn">

            </div>
        </div>
        <div v-if="interfaceMode == 'settings'">
            <div class="title">Open template from:</div>
            <div class="padding10_0px">
                <input type="radio" value="existing" v-model="templateSource" id="existingSource">
                    <label for="existingSource">Local template folder</label>
                <input type="radio" value="file" v-model="templateSource" id="fileSource">
                    <label for="fileSource">Select template file</label>
            </div>
            <div v-if="templateSource == 'existing'">
                <div class="title mtop10">Template name</div>
                <div class="select-wrap">
                    <select v-model="selectedTemplateFilename" class="template-select">
                        <option disabled value="" selected>Select one...</option>
                        <option v-for="template in templatesList" :value="template.filePath">{{ template.name }}</option>
                    </select>
                </div>
            </div>
            <div class="textfield-button" v-if="templateSource == 'file'">
                <div>Template file path</div>
                <Textfield v-model="fileName" style="width:100%" :errorMessage="templateError"/>
                <btn label="Open Template" @click="openTemplateIPC"/>
            </div>
            <div v-if="userSettings.length > 0 && templateConfig" class="template-name-block">
                <div class="hg2 padding20_0px">{{templateConfig?.name}}</div>
                <btn icon="reset" label="Reset settings" @click="resetTemplateSettingsIPC"/>
            </div>
            <div v-for="(setting, index) in userSettings as UserSetting[]" :key="index" class="mtop10"
                 :class="{
                        'w50' : (!setting.uiWidth || setting.uiWidth === 50),
                        'w100' : setting.uiWidth == 100
                    }">
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
                <div v-if="['TextInput'].indexOf(setting.type) !== -1" class="textfield-simple">
                    <div>{{setting.title}}</div>
                    <textfield v-model="setting.value" @update:modelValue="validateUserSettings(setting.type, index)" :error-message="setting.errorString" style="width:100%"/>
                </div>
            </div>
            <div v-if="templateConfig" class="textfield-simple">
                <div>Threads number</div>
                <textfield v-if="templateConfig?.multiThreadingEnabled" v-model="threadsNumber" @update:modelValue="" :error-message="threadsError" style="width: 100px"/>
                <div v-else>Multithreading is disabled in this template</div>
            </div>
            <div class="run-btn">
                <btn label="Run template" :disabled="isRunningBlocked" @click="runTemplateIPC"/>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/// <reference path="../type.d.ts" />
/// <reference path="../../templates/type.d.ts" />
import Btn from "../components/Btn.vue";
import {computed, ComputedRef, onMounted, ref, watch} from 'vue'
import { ipcRenderer } from 'electron'
import Textfield from "../components/Textfield.vue";
import ProgressBar from "../components/ProgressBar.vue";
import TextLog from "../components/TextLog.vue";
import ThreadStatuses from "../components/ThreadStatuses.vue";

const templateSource = ref('existing')
const templatesList = ref<LocalTemplateListItem[]>([])
const selectedTemplateFilename = ref('');
const fileName = ref('')
const isRunningBlocked = ref(true);
const userSettings = ref([]);
const templateConfig = ref<TemplateConfig | null>(null);
const templateError = ref('');
const interfaceMode = ref<TaskManagerInterfaceMode>('settings');
const isJobRunning = ref(false);
const taskStatusData = ref<TaskStatusUpdate | null>( null);
const textLogString = ref('')
const threadStatuses = ref<ThreadStatus[]>([])
const threadsNumber = ref('10');
const threadsError = ref('');

watch(() => templateSource.value, (newValue) => {
    ipcRenderer.send('TM', {type: 'read-local-templates'});
})
watch(() => selectedTemplateFilename.value, () => {
    fileName.value = selectedTemplateFilename.value;
    ipcRenderer.send('TM', {type: 'select-existing-template', fileName: fileName.value });
})
onMounted(() => {
    ipcRenderer.send('TM', {type: 'read-local-templates'});
})

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
            if (!validateInput(userSetting) || !validateThreads()) {
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
    if (typeof setting.required === "undefined") {
        return true;
    }
    if (typeof setting.required !== "undefined" && setting.required === false) {
        return true;
    }
    switch (setting.type) {

        case 'TextInput':
            if (setting.value) {
                return setting.value!.length > 0;
            }
            break;

        case 'OutputFile':
        case 'SourceFileTaskPerLine':
            //TODO check in internal API that file exists
            if (setting.fileName) {
                return setting.fileName!.length > 0; // || typeof setting.required  && setting.required === false
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
    ipcRenderer.send('TM', {
        type: 'run-opened-file',
        threadsNumber: parseInt(threadsNumber.value)
    });
}
function openTemplateIPC() {
    ipcRenderer.send('TM', {type: 'select-template-dialog'})
}
function resetTemplateSettingsIPC() {
    ipcRenderer.send('TM', {type: 'reset-template-settings'})
}

function selectFileForTemplateIPC(type : FileOpenDialogType, index: number) {
    ipcRenderer.send('TM', {
        type: 'select-file-for-template-settings',
        dialogType: type,
        index
    });
}
function resetManager() {
    resetTemplate();
    selectedTemplateFilename.value = '';
}
function resetTemplate() {
    fileName.value = '';
    isRunningBlocked.value = true;
    templateConfig.value = null;
    userSettings.value = [];
    taskStatusData.value = null;
    textLogString.value = '';
    interfaceMode.value = 'settings';
    threadStatuses.value = [];
}
function stopJobIPC() {
    isJobRunning.value = false;
    ipcRenderer.send('TM', {type: 'stop-job'});
}

ipcRenderer.on('TaskManager', (e, data) => {
    switch (data.type) {
        case 'set-template-name':
            resetTemplate()
            fileName.value = data.filename;
            validateUserSettings()
            break;

        case 'set-template-config':
            templateConfig.value = data.config;
            threadsNumber.value = data.taskThreadsAmount;
            if (data.config.userSettings) {
                userSettings.value = data.config.userSettings;
                validateUserSettings()
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

        case 'template-file-list':
            templatesList.value = data.list;
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
.w50 {
    display: inline-block;
    width: 50%;
    padding-right: 10px;
}
.w100 {
    display: inline-block;
    width: 100%;
}
.select-wrap {
    display: grid;
    grid-template-areas: "select";
    align-items: center;
    position: relative;
    margin-top: 10px;

    select,
    &::after {
    grid-area: select;
    }

    border: 1px solid var(--select-border);
    padding: 0 0.7em;

    font-size: 1.25rem;
    cursor: pointer;
    line-height: 1.1;
    background-color: #223333;
    border-radius: 6px;
    border: 1px solid #354F4F;

    // Custom arrow
    &:not(.select--multiple)::after {
    content: "";
    justify-self: end;
    width: 0.8em;
    height: 0.47em;
    background: url('../assets/icons/caret.svg') no-repeat 50% 50%;
    background-size: contain;
    //background-color: #fff;
    //clip-path: polygon(100% 0%, 0 0%, 50% 100%);
  }
}
.template-select {
    width: 100%;
    height: 40px;
    appearance: none;
    background-color: transparent;
    border: none;
    padding: 0 1em 0 0;
    margin: 0;
    width: 100%;
    font-family: inherit;
    font-size: inherit;
    cursor: inherit;
    line-height: inherit;
    z-index: 1;
    outline: none;
    color: #fff;
}


</style>
