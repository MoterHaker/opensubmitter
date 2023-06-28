<template>
    <div class="dashboard">
        <div class="textfield-button">
            <div>Template file path</div>
            <textfield :value="fileName" style="width:100%" :errorMessage="templateError"/>
            <btn label="Open Template" @click="openTemplateIPC"/>
        </div>
        <div v-if="userSettings.length > 0">
            <div class="hg2 padding20_0px">{{templateConfig.name}}</div>
        </div>
        <div v-for="(setting, index) in userSettings" :key="index" class="mtop10">
            <div v-if="['SourceFileTaskPerLine'].indexOf(setting.type) !== -1" class="textfield-button">
                <div>{{setting.title}}</div>
                <textfield :value="setting.fileName" style="width:100%"/>
                <btn label="Select File" @click="selectFileForTemplate('open', index)"/>
            </div>
            <div v-if="['OutputFile'].indexOf(setting.type) !== -1" class="textfield-button">
                <div>{{setting.title}}</div>
                <textfield :value="setting.fileName" style="width:100%"/>
                <btn label="Select File" @click="selectFileForTemplate('save', index)"/>
            </div>
        </div>
        <div class="run-btn">
            <btn label="Run template" :disabled="isRunningBlocked" @click="runTemplate"/>
        </div>
    </div>
</template>

<script setup lang="ts">
import Btn from "../components/Btn.vue";
import { ref } from 'vue'
import { ipcRenderer } from 'electron'
import {onMounted} from "vue";
import Textfield from "../components/Textfield.vue";

const fileName = ref('')
const isRunningBlocked = ref(true);
const userSettings: Array<UserSetting> | any = ref([]); //TODO correct typing
const templateConfig : OpenSubmitterTemplateProtocol | any = ref({});
const templateError = ref('');

function openTemplateIPC() {
    console.log('sending IPC')
    ipcRenderer.send('TM-select-template-dialog', {
        some: "data"
    })
}
type FileOpenDialogType = ('open' | 'save')

function selectFileForTemplate(type : FileOpenDialogType, index: number) {
    ipcRenderer.send('TM-select-file-for-template-settings', {
        type,
        index
    });
}
function runTemplate() {
    if (isRunningBlocked.value) {
        return;
    }
    ipcRenderer.send('TM-run-opened-file', fileName.value);
}
ipcRenderer.on('TM-set-template-name', (e, data) => {
    fileName.value = data;
    isRunningBlocked.value = false;
})
ipcRenderer.on('TM-set-template-config', (e, data) => {
    templateConfig.value = data;
    if (data.userSettings) {
        userSettings.value = data.userSettings;
    }
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

//.dashboard {
//    .va-card {
//        margin-bottom: 0 !important;
//    }
//}
</style>
