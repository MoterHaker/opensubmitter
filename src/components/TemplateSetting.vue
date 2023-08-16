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
            radioValue.value = props.setting.value.toString();
            // for (const option of props.setting.selectableOptions) {
            //     if (option.selected) {
            //         radioValue.value = option.value;
            //     }
            // }
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

<style scoped>
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
.check-wrap {
    display: inline-block;
}
.check-wrap input {
    visibility: hidden;
    position: absolute;
    z-index: -1;
}
.check-wrap input[type="radio"]:checked + .radio .faked-control .cir {
    transform: scale(1);
}
.check-wrap input[type="checkbox"]:checked + .checkbox .faked-control .checkmark::before {
    transform: rotate(45deg) scale(1);
}
.check-wrap input[type="checkbox"]:checked + .checkbox .faked-control .checkmark::after {
    transform: rotate(-45deg) scale(1);
}
.check-wrap label {
    display: -webkit-flex;
    display: -ms-flex;
    display: flex;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    cursor: pointer;
}
.check-wrap label .faked-control {
    margin-right: 0.25rem;
    width: 20px;
    height: 20px;
    position: relative;
    z-index: 1;
    background-color: #101919;
    color: #249496;
    border: 2px solid #0B1111;
}
.check-wrap label.checkbox .faked-control .checkmark::before {
    content: '';
    position: absolute;
    width: 6px;
    height: 2px;
    background-color: #249496;
    transform: rotate(45deg) scale(0);
    top: 8px;
    left: 2px;
    transition: transform 0.2s;
}
.check-wrap label.checkbox .faked-control .checkmark::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 2px;
    transform: rotate(-45deg) scale(0);
    background-color: #249496;
    top: 7px;
    left: 5px;
    transition: transform 0.2s;
}
.check-wrap label.radio .faked-control {
    border-radius: 50%;
}
.check-wrap label.radio .faked-control .cir {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    top: 3px;
    left: 3px;
    background-color: currentColor;
    transform: scale(0);
    transition: transform 0.2s;
}
.check-wrap.check-error {
    color: #cd4a5a;
}
.check-wrap.check-error .faked-control {
    color: #cd4a5a;
}
.check-wrap.check-correct {
    color: #268429;
}
.check-wrap.check-correct .faked-control {
    color: #268429;
}
.check-wrap .check-comment {
    font-size: 12px;
    padding-left: 24px;
}
</style>

