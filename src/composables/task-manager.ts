import { defineStore } from 'pinia'
import { useAPI } from "./api"
import {ref, watch} from "vue";
import { ipcRenderer } from 'electron'


export const useTaskManagerStore = defineStore('taskManager', () => {

    const templateSource = ref('existing')
    const selectedTemplateFilename = ref('')
    const fileName = ref('')
    const localTemplatesList = ref<PublicTemplate[]>([])
    const isLocalTemplatesUpdated = ref(false);

    watch(() => selectedTemplateFilename.value, () => {
        fileName.value = selectedTemplateFilename.value;
        ipcRenderer.send('TM', {type: 'select-existing-template', fileName: fileName.value });
    })

    const selectTemplateByName = (templateName: string): void => {
        for (const templateRow of localTemplatesList.value) {
            if (templateRow.name == templateName && templateRow.filePath) {
                selectedTemplateFilename.value = templateRow.filePath
                return;
            }
        }
    }

    const selectTemplateByPath = (path: string): void => {
        for (const templateRow of localTemplatesList.value) {
            if (templateRow.filePath?.indexOf(path) !== -1 && templateRow.filePath) {
                selectedTemplateFilename.value = templateRow.filePath
                return;
            }
        }
    }

    return {
        // refs:
        templateSource,
        selectedTemplateFilename,
        fileName,
        localTemplatesList,
        isLocalTemplatesUpdated,

        // methods:
        selectTemplateByName,
        selectTemplateByPath
    }
})