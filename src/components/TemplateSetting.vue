<template>
    <div class="mtop10"
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
</template>

<script setup lang="ts">

import Btn from "./Btn.vue";
import Textfield from "./Textfield.vue";
import {ipcRenderer} from "electron";
import {useTaskManagerStore} from "../composables/task-manager";

const taskManagerStore = useTaskManagerStore();

const props = defineProps<{
    index: number,
    setting: UserSetting
}>();

function selectFileForTemplateIPC(type : FileOpenDialogType, index: number) {
    ipcRenderer.send('TM', {
        type: 'select-file-for-template-settings',
        dialogType: type,
        index
    });
}
</script>