<template>
    <div>
        <div class="block-search">
            <div class="df gap16">
                <Textfield icon="search" placeholder="Search" v-model="searchString" />
            </div>
            <div class="tags df gap8">
                Try tags:
                <div class="tag">Accounts Generator</div>
                <div class="tag">Submitter</div>
            </div>
        </div>

        <div class="page-msg" v-if="searchString.length > 0 && searchResults.length == 0 && delayInt === null">
            <img src="../assets/images/no-result.svg" alt="">
            <div class="title">No results found</div>
            <div class="request-wrap df dir-col alitc gap16">
                <div class="text">Can't find a template which suits your needs?</div>
                <router-link to="/request" class="accent btn">Request a template</router-link>
            </div>
        </div>

        <div class="templates-list"  v-if="searchString.length > 0 && searchResults.length > 0">
            <template-item  v-for="template in resultsComputed" :template="template"/>
        </div>
    </div>
</template>
<script setup lang="ts">
import Textfield from "../components/Textfield.vue"
import TemplateItem from "../components/TemplateItem.vue"
const noResult = false
import { useAPI } from "../composables/api"

import {computed, onMounted, ref, watch} from "vue";

const { searchString, searchResults, searchTemplates } = useAPI();
const selectedCategory = ref('');
const delayInt = ref<any>(null);

const resultsComputed = computed((): PublicTemplate[] => {
    return searchResults.value.map(item => item as PublicTemplate);
})

watch(searchString, (newValue, oldValue) => {
    search()
});

function search() {
    clearInterval(delayInt.value);
    delayInt.value = setTimeout(async() => {
        await searchTemplates(searchString.value, selectedCategory.value)
        delayInt.value = null;
    }, 1000);
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
    }
}
</style>