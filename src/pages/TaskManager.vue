<template>
    <div class="dashboard">


        <div class="textfield-button">
            <div>Template file path</div>
            <Textfield v-model="fileName" style="width:100%" :errorMessage="templateError"/>
            <btn label="Open Template" @click="openTemplateIPC"/>
        </div>
        <div v-if="userSettings.length > 0 && templateConfig">
            <div class="hg2 padding20_0px">{{templateConfig?.name}}</div>
        </div>
        <div v-for="(setting, index) in userSettings" :key="index" class="mtop10">
            <div v-if="['SourceFileTaskPerLine'].indexOf(setting.type) !== -1" class="textfield-button">
                <div>{{setting.title}}</div>
                <Textfield v-model="setting.fileName" @update:modelValue="validateUserSettings(setting.type, index)" :error-message="inputsErrors[index]" style="width:100%"/>
                <btn label="Select File" @click="selectFileForTemplateIPC('open', index)"/>
            </div>
            <div v-if="['OutputFile'].indexOf(setting.type) !== -1" class="textfield-button">
                <div>{{setting.title}}</div>
                <textfield v-model="setting.fileName" @update:modelValue="validateUserSettings(setting.type, index)" :error-message="inputsErrors[index]" style="width:100%"/>
                <btn label="Select File" @click="selectFileForTemplateIPC('save', index)"/>
            </div>
        </div>
        <div class="run-btn">
            <btn label="Run template" :disabled="isRunningBlocked" @click="runTemplateIPC"/>
        </div>
    </div>
</template>

<script setup lang="ts">
import Btn from "../components/Btn.vue";
import { ref } from 'vue'
import { ipcRenderer } from 'electron'
import Textfield from "../components/Textfield.vue";


const fileName = ref('')
const isRunningBlocked = ref(true);
const userSettings = ref([]);
const templateConfig = ref<TemplateConfig | null>(null);
const templateError = ref('');
const inputsErrors = ref({});

type FileOpenDialogType = ('open' | 'save')

function validateUserSettings(type?: UserSettingsInput, index?: number) {
    let isEverythingChecked = true;
    for (const userSettingIndex in userSettings.value) {
        const userSetting : UserSetting = userSettings.value[userSettingIndex];
        if (typeof type !== "undefined" && typeof index !== "undefined") {
            //check exactly this input
            if (parseInt(userSettingIndex) === index) {
                if (userSetting.required) {
                    if (validateInput(userSetting)) {
                        if (typeof inputsErrors.value[userSettingIndex] !== "undefined") delete inputsErrors.value[userSettingIndex];
                    } else {
                        inputsErrors.value[userSettingIndex] = "Required field";
                    }
                }
                validateUserSettings(); //recheck everything silently
            }
        } else {
            //check all fields silently
            if (!validateInput(userSetting)) {
                isEverythingChecked = false;
            } else {
                if (typeof inputsErrors.value[userSettingIndex] !== "undefined") delete inputsErrors.value[userSettingIndex];
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
            return setting.fileName?.length > 0
            break;
    }
}

function runTemplateIPC() {
    if (isRunningBlocked.value) {
        console.log('running blocked');
        return;
    }
    ipcRenderer.send('TM-run-opened-file', fileName.value);
}
function openTemplateIPC() {
    ipcRenderer.send('TM-select-template-dialog')
}
function selectFileForTemplateIPC(type : FileOpenDialogType, index: number) {
    ipcRenderer.send('TM-select-file-for-template-settings', {
        type,
        index
    });
}
ipcRenderer.on('TM-set-template-name', (e, data) => {
    fileName.value = data;
    validateUserSettings()
})
ipcRenderer.on('TM-set-template-config', (e, data) => {
    templateConfig.value = data;
    if (data.userSettings) {
        userSettings.value = data.userSettings;
        validateUserSettings()
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
