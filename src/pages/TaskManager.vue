<template>
    <div class="dashboard">
        <div class="textfield-button">
            <div>Template file path</div>
            <textfield :value="fileName" style="width:100%"/>
            <btn label="Open Template" @click="testIPC"/>
        </div>
        <div class="run-btn">
            <btn label="Run template" :disabled="isRunningBlocked" @click="runTemplate"/>
        </div>
    </div>
</template>

<script setup>
import Btn from "../components/Btn.vue";
import { ref } from 'vue'
import { ipcRenderer } from 'electron'
import {onMounted} from "vue";
import Textfield from "../components/Textfield.vue";

const fileName = ref('')
const isRunningBlocked = ref(true);

function testIPC() {
    console.log('sending IPC')
    ipcRenderer.send('TM-select-template-dialog', {
        some: "data"
    })
}
function runTemplate() {
    if (isRunningBlocked.value) {
        return;
    }
    ipcRenderer.send('TM-run-opened-file', fileName.value);
}
ipcRenderer.on('TM-set-file-name', (e, data) => {
    console.log('e', e);
    console.log('data', data);
    fileName.value = data;
    isRunningBlocked.value = false;
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
