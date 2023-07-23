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

        <div class="templates-list"  v-if="searchStore.searchResults.length > 0">
            <template-item  v-for="template in searchStore.searchResults" :template="template"/>
        </div>
    </div>
</template>
<script setup lang="ts">
import Textfield from "../components/Textfield.vue"
import TemplateItem from "../components/TemplateItem.vue"
import { useSearchStore } from '../composables/search'

import {computed, onMounted, ref, watch} from "vue";

const searchStore = useSearchStore();

onMounted(() => {
    searchStore.doSearch()
})

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