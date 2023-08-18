<template>
    <div class="mtop20 setting-box"
         :class="{
                        'w50' : (!setting.uiWidth || setting.uiWidth === 50),
                        'w100' : setting.uiWidth == 100
                    }">
        <div v-if="setting.type == 'SourceFile'" class="textfield-button">
            <div>{{setting.title}}</div>
            <Textfield v-model="setting.fileName" @update:modelValue="taskManagerStore.validateUserSettings(setting.type, index)" :error-message="setting.errorString" style="width:100%"/>
            <btn label="Select File" @click="selectFileForTemplateIPC('open', index)"/>
        </div>
        <div v-if="setting.type == 'OutputFile'" class="textfield-button">
            <div>{{setting.title}}</div>
            <textfield v-model="setting.fileName" @update:modelValue="taskManagerStore.validateUserSettings(setting.type, index)" :error-message="setting.errorString" style="width:100%"/>
            <btn label="Create File" @click="selectFileForTemplateIPC('save', index)"/>
        </div>
        <div v-if="setting.type == 'TextInput'" class="textfield-simple">
            <div>{{setting.title}}</div>
            <textfield v-model="setting.value" @update:modelValue="taskManagerStore.validateUserSettings(setting.type, index)" :error-message="setting.errorString" style="width:100%"/>
        </div>
        <div v-if="setting.type == 'Textarea'" class="textfield-simple">
            <div>{{setting.title}}</div>
            <text-area v-model="setting.value" @update:modelValue="taskManagerStore.validateUserSettings(setting.type, index)" :error-message="setting.errorString" style="width:100%"/>
        </div>
        <div v-if="setting.type == 'Checkbox'">
            <div class="check-wrap" :class="{ 'check-error' : (setting.errorString && setting.errorString.length > 0) }">
                <input type="checkbox" v-model="checkboxValue" :name="setting.name" :id="randId">
                <label :for="randId" class="checkbox">
                    <span class="faked-control"><div class="checkmark"></div></span>
                    <span class="label-text">{{ setting.title }}</span>
                </label>
            </div>
        </div>
        <div v-if="setting.type == 'Radio'">
            <div style="font-size: 12px">{{setting.title}}</div>
            <div v-for="(option, index) in setting.selectableOptions" :key="index"
                 class="check-wrap radio-db"
                 :class="{ 'check-error' : (setting.errorString && setting.errorString.length > 0) }">
                <input type="radio"
                       v-model="radioValue"
                       :name="setting.name"
                       :id="randId + index"
                       :checked="radioValue === (option as SelectableOption).value"
                       :value="(option as SelectableOption).value"
                >
                <label :for="randId + index" class="radio">
                    <span class="faked-control"><div class="cir"></div></span>
                    <span class="label-text">{{ (option as SelectableOption).title }}</span>
                </label>
            </div>
        </div>
        <div v-if="setting.type == 'Select'">
            <div style="font-size: 12px">{{setting.title}}</div>
            <div class="select-wrap mbottom20">
                <select class="styled-select" v-model="setting.value">
                    <option disabled value="" selected>Select one...</option>
                    <option v-for="(option, index) in setting.selectableOptions"
                            :key="index"
                            :value="(option as SelectableOption).value"
                    >{{ (option as SelectableOption).title }}</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/// <reference path="../../templates/type.d.ts" />
import Btn from "./Btn.vue";
import Textfield from "./Textfield.vue";
import TextArea from "./TextArea.vue";
import {ipcRenderer} from "electron";
import {useTaskManagerStore} from "../composables/task-manager";
import {onMounted, ref, watch} from "vue";

const taskManagerStore = useTaskManagerStore();

const props = defineProps<{
    index: number,
    setting: UserSetting
}>();

const randId = Math.random().toString();

const checkboxValue = ref(false);
const radioValue = ref('');

watch(() => checkboxValue.value, () => {
    props.setting.value = checkboxValue.value
})

watch(() => radioValue.value, () => {
    props.setting.value = radioValue.value;
})

onMounted(() => {
    switch (props.setting.type) {
        case 'Checkbox':
            if (typeof props.setting.value !== "undefined" && props.setting.value === true) {
                checkboxValue.value = true;
            }
            break;

        case 'Radio':
            if (!props.setting.selectableOptions) return;
            if (typeof props.setting.value == "string") {
                radioValue.value = props.setting.value.toString();
            }
            break;
    }
})


function selectFileForTemplateIPC(type : FileOpenDialogType, index: number) {
    ipcRenderer.send('TM', {
        type: 'select-file-for-template-settings',
        dialogType: type,
        index
    });
}
</script>

<style lang="less" scoped>
.setting-box .select-wrap {
    font-size: 1rem;
    padding: 0 0.5em !important;
    line-height: 1 !important;
    height: 38px;
}
.setting-box {
    display: inline-block;
    vertical-align: top;
}
.radio-db {
    display: block !important;
    margin-top: 10px;
}
</style>

