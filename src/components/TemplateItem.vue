<template>
    <div class="template-item">
        <div class="col-icon">
            <img src="../assets/images/temp-icon-proxy.png" alt="">
        </div>
        <div class="col-text">
            <div class="title">Proxy Checker Mofo</div>
            <div class="desc">Check your proxies for availability and speed at google.com search page</div>
        </div>
        <div class="col-stats">
            <div class="col">
                <div class="statname">Views</div>
                <div class="statval">12,569</div>
            </div>
            <div class="col">
                <div class="statname">Downloads</div>
                <div class="statval">12,569</div>
            </div>
            <div class="col">
                <div class="statname">Runs</div>
                <div class="statval">12,569</div>
            </div>
        </div>
        <div class="col-dn">
            <btn-icon icon="check" />
        </div>
    </div>
</template>

<script setup lang="ts">
import BtnIcon from "../components/BtnIcon.vue"
</script>

<style lang="less" scoped>
.template-item {
    border-radius: 16px;
    border: 1px solid #2B3E3E;
    padding: 16px;
    display: flex;
    align-items: center;
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
.statname {
    font-size: 14px;
    font-weight: bold;
}
.statval {
    font-size: 32px;
    font-weight: 300;
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