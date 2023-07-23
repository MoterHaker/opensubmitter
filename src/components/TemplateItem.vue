<template>
    <router-link to="/template" class="template-item">
        <div class="col-icon">
            <img :src="template.icon">
        </div>
        <div class="col-text">
            <div class="title">{{ template.name }}</div>
            <div class="desc">{{ template.description }}</div>
        </div>
        <div class="col-stats">
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
            <btn icon="download" />
        </div>
    </router-link>
</template>

<script setup lang="ts">
/// <reference path="../components/type.d.ts" />
import Btn from "../components/Btn.vue"
const props = defineProps<{
    template: PublicTemplate;
}>();
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