<template>
    <div>
        <div v-if="taskManagerStore.interfaceMode == 'running'">

            {{ taskManagerStore.taskStatusData?.status }} {{ taskManagerStore.taskStatusData?.status == 'Running tasks' ? ' ('+taskManagerStore.taskStatusData?.pending + ' pending, '+taskManagerStore.taskStatusData?.active + ' active, ' + taskManagerStore.taskStatusData?.completed + ' completed)'  : ''}}
            <div class="progress-block">
                <progress-bar :percents="progressComputed"/>
                <btn label="Restart" @click="taskManagerStore.restartJob" v-if="!taskManagerStore.isJobRunning" class="btn-row"/>
                <btn label="Stop" @click="taskManagerStore.stopJobIPC" v-if="taskManagerStore.isJobRunning" class="btn-row"/>
            </div>

            <div class="subtitle mtop20" height="200" v-if="taskManagerStore.threadStatuses.length > 0">Thread Statuses:</div>
            <thread-statuses class="mtop10" :statuses="taskManagerStore.threadStatuses" v-if="taskManagerStore.threadStatuses.length > 0"/>
            <div class="subtitle mtop20" height="200">Job logs:</div>
            <text-log v-model="taskManagerStore.textLogString" class="mtop10"/>

            <div v-if="taskManagerStore.hasExportUserSetting && !taskManagerStore.isJobRunning" class="mtop20">
                <div>Data exported ({{ taskManagerStore.exportedCount }} records)</div>
                <div class="mtop10"><btn label="Export to another file" @click="taskManagerStore.exportResultsIPC" :loading="taskManagerStore.isExporting"/></div>
            </div>


            <div v-if="taskManagerStore.resultTableHeader" class="subtitle mtop20 mbottom10" height="200">Job results:</div>
            <results-table :results-data="taskManagerStore.resultsData" :result-table-header="taskManagerStore.resultTableHeader"/>

        </div>

        <div v-if="taskManagerStore.interfaceMode == 'settings'">
            <div class="title">Open template from:</div>
            <div class="padding10_0px">

                <switch-toggler left="Local templates collection" right="Open template file" :state="taskManagerStore.templateSource === 'file'" @update="taskManagerStore.switchSourceToggler" />

            </div>
            <div v-if="taskManagerStore.templateSource == 'existing'">
                <div class="title mtop10">Template name</div>
                <div class="select-wrap">
                    <select v-model="taskManagerStore.selectedTemplateFilename" class="styled-select">
                        <option disabled value="" selected>Select one...</option>
                        <option v-for="template in taskManagerStore.localTemplatesList" :value="template.filePath">{{ template.name }}</option>
                    </select>
                </div>
                <div v-if="taskManagerStore.templateError.length > 0" class="error mtop10">{{ taskManagerStore.templateError }}</div>
            </div>
            <div class="textfield-button" v-if="taskManagerStore.templateSource == 'file'">
                <div>Template file path</div>
                <Textfield v-model="taskManagerStore.selectedTemplateFilename" style="width:100%" :errorMessage="taskManagerStore.templateError"/>
                <btn label="Open Template" @click="taskManagerStore.openTemplateIPC"/>
            </div>
            <div v-if="taskManagerStore.selectedTemplateFilename" class="mtop10 mbottom10">{{ taskManagerStore.templateConfig?.description }}</div>
            <div v-if="taskManagerStore.userSettings.length > 0 && taskManagerStore.templateConfig" class="template-name-block">
                <div class="hg2 padding20_0px">{{taskManagerStore.templateConfig?.name}}</div>
                <btn icon="reset" label="Reset settings" @click="taskManagerStore.resetTemplateSettingsIPC" v-if="taskManagerStore.isTemplateSettingsResetAvailable"/>
            </div>
            <template-setting
                v-for="(setting, index) in taskManagerStore.userSettings"
                :key="index"
                :index="index" :setting="setting"/>
            <div v-if="taskManagerStore.templateConfig" class="textfield-simple mtop20">
                <div>Threads number</div>
                <textfield v-if="taskManagerStore.templateConfig?.multiThreadingEnabled" v-model="taskManagerStore.threadsNumber" @update:modelValue="" :error-message="taskManagerStore.threadsError" style="width: 100px"/>
                <div v-else>Multithreading is disabled in this template</div>
            </div>
            <div v-if="taskManagerStore.hasPuppeteerInCapabilities && taskManagerStore.isDevelopmentEnv">
                <div class="mt24">
                    <div style="font-size: 12px">Deleveper Settings</div>
                </div>
                <div class="check-wrap mt8">
                    <input type="checkbox"
                           v-model="taskManagerStore.puppeteerHeadOnMode"
                           id="puppeteerHeadOn"><label for="puppeteerHeadOn" class="checkbox">
                        <span class="faked-control"><div class="checkmark"></div></span>
                        <span class="label-text">Use Puppeteer head-on mode</span>
                    </label>
                </div>
            </div>
            <div class="run-btn">
                <btn label="Run template" :disabled="taskManagerStore.isRunningBlocked" @click="runTemplate"/>
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
import ResultsTable from "../components/ResultsTable.vue";
import TemplateSetting from "../components/TemplateSetting.vue";
import {useRouter} from "vue-router";
import {useTaskManagerStore} from "../composables/task-manager";
import {useAPI} from "../composables/api";

const taskManagerStore = useTaskManagerStore();
const router = useRouter();
const api = useAPI();

function runTemplate() {
    api.reportTemplateRun((taskManagerStore.templateConfig as TemplateConfig).name);
    taskManagerStore.runTemplateIPC();
}

watch(() => taskManagerStore.templateSource, (newValue) => {
    ipcRenderer.send('TM', {type: 'read-local-templates'});
    taskManagerStore.resetTemplate();
})

onMounted(() => {
    ipcRenderer.send('TM', {type: 'read-local-templates'});
})

const progressComputed: ComputedRef<number> = computed(() => {
    if (typeof taskManagerStore.taskStatusData?.completed === "undefined" || typeof taskManagerStore.taskStatusData?.pending === "undefined") return 0;
    const totalTasks = taskManagerStore.taskStatusData!.completed + taskManagerStore.taskStatusData!.pending;
    if (totalTasks === 0) return 0;
    return 100 - Math.round(taskManagerStore.taskStatusData!.pending / totalTasks * 100);
})




</script>

<style lang="less">
@import '../assets/css/vars.less';
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

</style>
