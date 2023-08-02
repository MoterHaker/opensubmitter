<template>
    <div class="template-item">
        <div class="col-icon" @click="viewTemplate">
            <img :src="template.icon">
        </div>
        <div class="col-text" @click="viewTemplate">
            <div class="title">{{ template.name }}</div>
            <div class="desc">{{ template.description }}</div>
            <div class="category">{{ template.category }}</div>
        </div>
        <div class="col-stats" @click="viewTemplate">
            <div class="col">
                <div class="statname">Views</div>
                <div class="statval">{{ template.views }}</div>
            </div>
            <div class="col">
                <div class="statname">Downloads</div>
                <div class="statval">{{ template.downloads }}</div>
            </div>
            <div class="col">
                <div class="statname">Runs</div>
                <div class="statval">{{ template.runs }}</div>
            </div>
        </div>
        <div class="col-dn">
            <btn v-if="!template.existsLocally" icon="download" :loading="isLoading" @click="download(template.id)"/>
            <btn v-if="template.existsLocally" icon="play" @click="runTemplate(template.name)"/>
        </div>
    </div>
</template>

<script setup lang="ts">
/// <reference path="../composables/type.d.ts" />
import Btn from "../components/Btn.vue"
import {useSearchStore} from "../composables/search";
import {ref} from "vue";
import {useRouter} from "vue-router";
import {useTaskManagerStore} from "../composables/task-manager";

const searchStore = useSearchStore();
const router = useRouter()
const props = defineProps<{
    template: PublicTemplate;
}>();
const isLoading = ref(false)
const taskManagerStore = useTaskManagerStore();

function viewTemplate() {
    router.push('/template');
    searchStore.selectedTemplate = props.template
}
function download(id: number) {
    isLoading.value = true
    searchStore.downloadTemplateInMain(id)
}
function runTemplate(name: string) {
    router.push('/dashboard');
    taskManagerStore.selectTemplateByName(name)
}

</script>

<style lang="less" scoped>
.template-item {
    border-radius: 16px;
    border: 1px solid #2B3E3E;
    padding: 16px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: #fff;
    text-decoration: none;
    &:hover {
        background: #2B3E3E;
    }
}
.col-text {
    width: 40%;
    margin-right: 32px;
    .title {
        font-size: 20px;
        font-weight: bold;
        margin-top: -4px;
    }
    .desc {
        font-size: 15px;
        font-weight: 300;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .category {
        margin-top: 5px;
        font-size: 11px;
        font-weight: 300;
    }
}
.col-icon {
    margin-right: 16px;
    img {width: 68px;}
}
.col-stats {
    gap: 16px;
    display: flex;
    margin-right: auto;
}
</style>