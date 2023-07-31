import { defineStore } from 'pinia'
import { useAPI } from "./api"
import {ref, watch} from "vue";
const { searchTemplates, getTemplateCategories } = useAPI();
import { ipcRenderer } from 'electron'


export const useSearchStore = defineStore('search', () => {

    const searchString = ref('')
    const searchResults = ref<PublicTemplate[]>([]);
    const delayInt = ref<any>(null)
    const selectedCategory = ref('')
    const categoriesList = ref<string[]>([]);
    const selectedTemplate = ref<PublicTemplate | null>(null);


    watch(searchString, delaySearch)

    function delaySearch(newValue: any) {
        clearInterval(delayInt.value);
        delayInt.value = setTimeout(async() => {
            delayInt.value = null;
            await doSearch()
        }, 500);
    }

    async function doSearch() {
        searchResults.value = await searchTemplates(searchString.value, selectedCategory.value)
    }

    async function selectCategory(category: string) {
        if (selectedCategory.value == category) selectedCategory.value = '';
        else selectedCategory.value = category;
        await doSearch();
    }

    async function updateTemplateCategories() {
        categoriesList.value = await getTemplateCategories();
    }

    function downloadTemplateInMain(id: number) {
        ipcRenderer.send('TM', {type: 'download-template', id });
    }

    return {
        //refs
        searchResults,
        selectedCategory,
        delayInt,
        searchString,
        categoriesList,
        selectedTemplate,

        //methods
        doSearch,
        selectCategory,
        downloadTemplateInMain,
        updateTemplateCategories }
})