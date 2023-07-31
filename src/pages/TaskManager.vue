<template>
    <div>
        <div v-if="taskManagerStore.interfaceMode == 'running'">

            {{ taskManagerStore.taskStatusData?.status }} {{ taskManagerStore.taskStatusData?.status == 'Running tasks' ? ' ('+taskManagerStore.taskStatusData?.pending + ' pending, '+taskManagerStore.taskStatusData?.active + ' active, ' + taskManagerStore.taskStatusData?.completed + ' completed)'  : ''}}
            <div class="progress-block">
                <progress-bar :percents="progressComputed"/>
                <btn label="Restart" @click="taskManagerStore.restartJob" v-if="!taskManagerStore.isJobRunning" class="btn-row"/>
                <btn label="Stop" @click="stopJobIPC" v-if="taskManagerStore.isJobRunning" class="btn-row"/>
            </div>

            <div class="subtitle mtop20" height="200" v-if="taskManagerStore.threadStatuses.length > 0">Thread Statuses:</div>
            <thread-statuses class="mtop10" :statuses="taskManagerStore.threadStatuses" v-if="taskManagerStore.threadStatuses.length > 0"/>
            <div class="subtitle mtop20" height="200">Job logs:</div>
            <text-log v-model="taskManagerStore.textLogString" class="mtop10"/>

            <div v-if="taskManagerStore.resultTableHeader" class="subtitle mtop20 mbottom10" height="200">Job results:</div>
            <table class="table-docs" v-if="taskManagerStore.resultTableHeader">
                <thead>
                <tr>
                    <td v-for="row in taskManagerStore.resultTableHeader">
                        {{row.title}}
                    </td>
                </tr>
                </thead>
                <tbody v-if="taskManagerStore.resultsData.length == 0">
                    <tr><td colspan="100" align="center">No results yet</td></tr>
                </tbody>
                <tbody v-if="taskManagerStore.resultsData.length > 0">
                    <tr v-for="row in taskManagerStore.resultsData">
                        <td v-for="property in row" :class="getResultCellPropertyClasses(property)">
                            <span v-if="!property.isResult">{{ property.value }}</span>
                            <span v-else>{{ property.value ? 'Success' : 'Failed' }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="taskManagerStore.interfaceMode == 'settings'">
            <div class="title">Open template from:</div>
            <div class="padding10_0px">

                <switch-toggler left="Local templates collection" right="Open template file" :state="taskManagerStore.templateSource === 'file'" @update="taskManagerStore.switchSourceToggler" />

            </div>
            <div v-if="taskManagerStore.templateSource == 'existing'">
                <div class="title mtop10">Template name</div>
                <div class="select-wrap">
                    <select v-model="taskManagerStore.selectedTemplateFilename" class="template-select">
                        <option disabled value="" selected>Select one...</option>
                        <option v-for="template in taskManagerStore.localTemplatesList" :value="template.filePath">{{ template.name }}</option>
                    </select>
                </div>
                <div v-if="taskManagerStore.templateError.length > 0" class="error mtop10">{{ taskManagerStore.templateError }}</div>
            </div>
            <div class="textfield-button" v-if="taskManagerStore.templateSource == 'file'">
                <div>Template file path</div>
                <Textfield v-model="taskManagerStore.fileName" style="width:100%" :errorMessage="taskManagerStore.templateError"/>
                <btn label="Open Template" @click="openTemplateIPC"/>
            </div>
            <div v-if="taskManagerStore.selectedTemplateFilename" class="mtop10 mbottom10">{{ taskManagerStore.templateConfig?.description }}</div>
            <div v-if="taskManagerStore.userSettings.length > 0 && taskManagerStore.templateConfig" class="template-name-block">
                <div class="hg2 padding20_0px">{{taskManagerStore.templateConfig?.name}}</div>
                <btn icon="reset" label="Reset settings" @click="resetTemplateSettingsIPC" v-if="taskManagerStore.isTemplateSettingsResetAvailable"/>
            </div>
            <div v-for="(setting, index) in taskManagerStore.userSettings as UserSetting[]" :key="index" class="mtop10"
                 :class="{
                        'w50' : (!setting.uiWidth || setting.uiWidth === 50),
                        'w100' : setting.uiWidth == 100
                    }">
                <div v-if="['SourceFileTaskPerLine'].indexOf(setting.type) !== -1" class="textfield-button">
                    <div>{{setting.title}}</div>
                    <Textfield v-model="setting.fileName" @update:modelValue="taskManagerStore.validateUserSettings(setting.type, index)" :error-message="setting.errorString" style="width:100%"/>
                    <btn label="Select File" @click="selectFileForTemplateIPC('open', index)"/>
                </div>
                <div v-if="['OutputFile'].indexOf(setting.type) !== -1" class="textfield-button">
                    <div>{{setting.title}}</div>
                    <textfield v-model="setting.fileName" @update:modelValue="taskManagerStore.validateUserSettings(setting.type, index)" :error-message="setting.errorString" style="width:100%"/>
                    <btn label="Create File" @click="selectFileForTemplateIPC('save', index)"/>
                </div>
                <div v-if="['TextInput'].indexOf(setting.type) !== -1" class="textfield-simple">
                    <div>{{setting.title}}</div>
                    <textfield v-model="setting.value" @update:modelValue="taskManagerStore.validateUserSettings(setting.type, index)" :error-message="setting.errorString" style="width:100%"/>
                </div>
            </div>
            <div v-if="taskManagerStore.templateConfig" class="textfield-simple">
                <div>Threads number</div>
                <textfield v-if="taskManagerStore.templateConfig?.multiThreadingEnabled" v-model="taskManagerStore.threadsNumber" @update:modelValue="" :error-message="taskManagerStore.threadsError" style="width: 100px"/>
                <div v-else>Multithreading is disabled in this template</div>
            </div>
            <div class="run-btn">
                <btn label="Run template" :disabled="taskManagerStore.isRunningBlocked" @click="runTemplateIPC"/>
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
import SwitchToggler from "../components/SwitchToggler.vue";
import {useRouter} from "vue-router";
import {useTaskManagerStore} from "../composables/task-manager";
import {useTitleStore} from "../composables/titles";

const taskManagerStore = useTaskManagerStore();
const router = useRouter();



watch(() => taskManagerStore.templateSource, (newValue) => {
    ipcRenderer.send('TM', {type: 'read-local-templates'});
    taskManagerStore.resetTemplate();
})

onMounted(() => {
    ipcRenderer.send('TM', {type: 'read-local-templates'});
})

function getResultCellPropertyClasses(property: ResultTableRow) {
    const res: any = {};
    if (typeof property.isResult === "boolean" && property.isResult) {
        res[property.value ? 'success' : 'error'] = true;
    }
    if (typeof property.nowrap === "boolean" && property.nowrap) {
        res['nowrap'] = true;
    } else {
        res['break-word'] = true;
    }
    return res;
}

const progressComputed: ComputedRef<number> = computed(() => {
    if (typeof taskManagerStore.taskStatusData?.completed === "undefined" || typeof taskManagerStore.taskStatusData?.pending === "undefined") return 0;
    const totalTasks = taskManagerStore.taskStatusData!.completed + taskManagerStore.taskStatusData!.pending;
    if (totalTasks === 0) return 0;
    return 100 - Math.round(taskManagerStore.taskStatusData!.pending / totalTasks * 100);
})

function runTemplateIPC() {
    if (taskManagerStore.isRunningBlocked) {
        console.log('running blocked');
        return;
    }
    useTitleStore().subtitle = 'Running "'+(taskManagerStore.templateConfig as TemplateConfig).name+"\""
    ipcRenderer.send('TM', {
        type: 'run-opened-file',
        threadsNumber: parseInt(taskManagerStore.threadsNumber)
    });
}
function openTemplateIPC() {
    ipcRenderer.send('TM', {type: 'select-template-dialog'})
}
function resetTemplateSettingsIPC() {
    taskManagerStore.isTemplateSettingsResetAvailable = false;
    ipcRenderer.send('TM', {type: 'reset-template-settings'})
}

function selectFileForTemplateIPC(type : FileOpenDialogType, index: number) {
    ipcRenderer.send('TM', {
        type: 'select-file-for-template-settings',
        dialogType: type,
        index
    });
}

function stopJobIPC() {
    useTitleStore().subtitle = "Run templates"
    taskManagerStore.isJobRunning = false;
    ipcRenderer.send('TM', {type: 'stop-job'});
}

</script>

<style lang="less">
@import '../assets/css/vars.less';
.break-word span {
    white-space: pre-wrap;
    word-break: break-word;
}
.nowrap span {
    text-wrap: none;
}
.success {
    color: #00CD6B;
}
.error {
    color: red;
}
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
