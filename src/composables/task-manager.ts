import { defineStore } from 'pinia'
import { useAPI } from "./api"
import {ref, watch} from "vue";
import { ipcRenderer } from 'electron'


export const useTaskManagerStore = defineStore('taskManager', () => {

    const templateSource = ref('existing')
    const selectedTemplateFilename = ref('')
    const fileName = ref('')

    watch(() => selectedTemplateFilename.value, () => {
        fileName.value = selectedTemplateFilename.value;
        ipcRenderer.send('TM', {type: 'select-existing-template', fileName: fileName.value });
    })

    watch(() => templateSource.value, (newValue) => {
        ipcRenderer.send('TM', {type: 'read-local-templates'});
    })

    return {
        // ref:
        templateSource,
        selectedTemplateFilename,
        fileName
    }
})