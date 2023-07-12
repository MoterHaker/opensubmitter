<template>
    <div>
<!--        <component :is="modalToShow" />-->
        <div class="df-100vh ">
            <div class="col-side-nav">
                <div class="logo-wrap"><img src="../assets/images/logo.svg" alt=""></div>
                <router-link class="menu-item" to="/dashboard">
                    <img src="../assets/icons/play.svg" alt="">
                    Task Manager
                </router-link>
                <router-link class="menu-item" to="/templates">
                    <img src="../assets/icons/box.svg" alt="">
                    Templates
                </router-link>
                <router-link class="menu-item" to="/uikit">
                    <img src="../assets/icons/settings.svg" alt="">
                    UI kit
                </router-link>
            </div>
            <div class="col-right">
                <div class="col-header">
                    <div class="title">{{ route.meta.title }}</div>
                    <div class="subtitle">{{ route.meta.subtitle }}</div>
                </div>
                <div class="col-content">
                    <router-view  />
                </div>
            </div>
        </div>
    </div>

</template>

<script setup lang="ts">
import {useRoute} from "vue-router";

const route = useRoute()
</script>

<style lang="less" scoped>
@import '../assets/css/vars.less';

.menu-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 18px;
    height: 60px;
    padding: 0 32px;
    color: #67AAAA;
    text-decoration: none;
    font-weight: 500;
    &.router-link-exact-active {
        background: linear-gradient(90deg, rgba(0, 201, 205, 0.00) 0%, rgba(0, 201, 205, 0.30) 100%);
        border-right: 3px solid #00C9CD;
        color: #fff;
    }
}
.logo-wrap {
    padding-left: 32px;
    margin-bottom: 32px;
}
.col-side-nav {
    background: #071F1F;
    display: flex;
    flex-direction: column;
    width: 256px;
    margin-right: 0px;
    padding-top: 32px;
}
.col-right {
    flex: 1;
}
.col-content {
    padding: 40px;
    background: #162828;
}
.col-header {
    .title {
        font-size: 24px;
    }
    .subtitle {
        font-size: 13px;
        margin-top: 10px;
        opacity: 0.7;
    }
    padding: 40px;
    background: #182E2E;
}

@media (max-width: @phones-portrait) {
    .col-header {
        margin-top: 40px;
        padding: 25px;
    }
    .col-right {
      top: 0px;
    }
    .col-side-nav {
    position: fixed;
    background: #332E2B;
    z-index: 2;
    flex-direction: row;
      top: 0px;
    //bottom: @headerHeightBottom;
    margin: 0;
    padding: 0;
    width: auto;
    overflow: auto;
    font-size: 14px;
    width: 100%;
    a {
      padding: 12px 16px;
      white-space: nowrap;
    }
    }
    .col-content {
    padding: 24px;
    padding-bottom: 120px;
    }
}
</style>
