import { defineStore } from 'pinia'
import {ref, watch} from "vue";
export const useTitleStore = defineStore('title', () => {

    const title = ref('');
    const subtitle = ref('');


    return { title, subtitle }

})