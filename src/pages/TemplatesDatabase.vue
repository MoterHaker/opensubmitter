<template>
    <div>
        <div class="block-search">
            <div class="df gap16">
                <Textfield icon="search" placeholder="Search" v-model="searchStore.searchString"/>
            </div>
            <div class="tags df gap8" v-if="searchStore.categoriesList.length > 0">
                Try categories:
                <div class="tag"
                     :class="{ 'selected' : searchStore.selectedCategory == category }"
                     v-for="category in searchStore.categoriesList"
                     @click="searchStore.selectCategory(category)">{{ category }}</div>
            </div>
        </div>

        <div class="page-msg" v-if="searchStore.searchString.length > 0 && searchStore.searchResults.length == 0 && searchStore.delayInt === null">
            <img src="../assets/images/no-result.svg" alt="">
            <div class="title">No results found</div>
            <div class="request-wrap df dir-col alitc gap16">
                <div class="text">Can't find a template which suits your needs?</div>
                <router-link to="/request" class="accent btn">Request a template</router-link>
            </div>
        </div>

        <div class="templates-list"  v-if="existingSearchResults.length > 0">
            <template-item  v-for="template in existingSearchResults" :template="template"/>
        </div>
    </div>
</template>
<script setup lang="ts">
import Textfield from "../components/Textfield.vue"
import TemplateItem from "../components/TemplateItem.vue"
import { useSearchStore } from '../composables/search'

import {computed, defineAsyncComponent, onMounted, ref, watch} from "vue";
import {ipcRenderer} from "electron";
import {useTaskManagerStore} from "../composables/task-manager";

const searchStore = useSearchStore();
const taskManagerStore = useTaskManagerStore();

const existingSearchResults = computed(() => {
    for (const result of searchStore.searchResults) {
        if (taskManagerStore.localTemplatesList.find(template => {
            return template.name === result.name
        })) {
            result.existsLocally = true;
        }
    }
    return searchStore.searchResults;
})

onMounted(async() => {
    // read local templates and only then query remote API
    // to match existing local templates with remote
    await new Promise(async resolve => {
        ipcRenderer.send('TM', {type: 'read-local-templates'});
        for (let wait=0; wait<10; wait++) {
            await delay(500);
            if (taskManagerStore.isLocalTemplatesUpdated === true) resolve();
        }
        resolve();
    })
    await searchStore.doSearch()
})

const delay = (time: number) : Promise<void> => {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    });
}

</script>
<style lang="less" scoped>
.request-wrap {
    font-size: 24px;
}
.templates-list {
    margin-top: 32px;
    gap: 16px;
    display: flex;
    flex-direction: column;
}
.block-search {
    .textfield {flex: 1;}
}
.tags {
    font-size: 13px;
    margin-top: 8px;
    display: flex;
    align-items: center;
    .tag {
        background: #2B3E3E;
        border-radius: 4px;
        padding: 4px 8px;
        color: #fff;
        cursor: pointer;
        &:hover {
            background: #3B4E4E;
        }
        &.selected {
            background: #557272;
        }
    }
}
</style>