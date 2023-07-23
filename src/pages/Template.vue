<template>
    <div>
        <div class="template-info">
            <div class="col-desc">
                <div class="desc">
                    {{ (searchStore.selectedTemplate as PublicTemplate).description }}
                </div>
                <div class="meta">
                    Submitted: {{ (searchStore.selectedTemplate as PublicTemplate).created }}
                    <btn class="mtop10" icon="download" label="Download template" @click="searchStore.downloadTemplateInMain((searchStore.selectedTemplate as PublicTemplate).id)"/>
                </div>
            </div>
            <div class="col-stats">
                <div class="col">
                    <div class="statname">Views</div>
                    <div class="statval">{{ (searchStore.selectedTemplate as PublicTemplate).views }}</div>
                </div>
                <div class="col">
                    <div class="statname">Downloads</div>
                    <div class="statval">{{ (searchStore.selectedTemplate as PublicTemplate).downloads }}</div>
                </div>
                <div class="col">
                    <div class="statname">Runs</div>
                    <div class="statval">{{ (searchStore.selectedTemplate as PublicTemplate).runs }}</div>
                </div>
            </div>
        </div>
        <div class="source">
            Source code:
            <source-code class="mt8" :code="templateContent ? templateContent.contents : ''" :is-loading="templateContent == null"/>
        </div>
    </div>
</template>
<script setup lang="ts">
/// <reference path="../composables/type.d.ts" />

import {useRoute} from "vue-router";
import {useSearchStore} from "../composables/search";
const searchStore = useSearchStore();
import SourceCode from "../components/SourceCode.vue"
import {onBeforeUnmount, onMounted, ref} from "vue";
import {useTitleStore} from "../composables/titles";
const titleStore = useTitleStore();
import { useAPI } from "../composables/api";
import Btn from "../components/Btn.vue";
const { downloadTemplate } = useAPI();
const templateContent = ref<TemplateContent | null>(null);


onMounted(async() => {
    titleStore.title = searchStore.selectedTemplate!.name
    templateContent.value = await downloadTemplate(searchStore.selectedTemplate!.id)
})
onBeforeUnmount(() => {
    titleStore.title = '';
})

const code = `..loading..`;
</script>
<style lang="less" scoped>
.template-info {
    display: flex;
    gap: 60px
}
.desc {
    font-size: 18px;
    margin-bottom: 24px;
}
.meta {
    font-size: 13px;
    line-height: 1.8;
    opacity: 0.7;
}
.col-desc {
    flex-basis: 50%;
}
.col-stats {
    display: flex;
    gap: 32px;
}
.source {
    margin-top: 32px;
}
</style>