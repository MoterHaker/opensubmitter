<template>
    <div>
        <div class="df-100vh ">
            <div class="col-side-nav">
                <div class="logo-wrap"><img src="../assets/images/logo.svg" alt=""></div>
                <router-link class="menu-item" to="/dashboard">
                    <svg-icon name="play" />
                    Task Manager
                </router-link>
                <router-link class="menu-item" to="/templates">
                    <svg-icon name="box" />
                    Templates
                </router-link>
                <router-link class="menu-item" to="/settings">
                    <svg-icon name="settings" />
                    Settings
                </router-link>
                <router-link class="menu-item" to="/uikit" v-if="isDevelopmentEnv()">
                    UI kit
                </router-link>

                <div class="update-available" v-if="api.isUpdateAvailable.value">
                    <div class="title">v. {{api.newVersion.value}} is available</div>
                    <a class="btn" :href="api.updateLink.value" target="_blank">Download</a>
                </div>
            </div>
            <div class="col-main">
                <div class="col-header">
                    <div class="col-left">
                        <div class="title">{{ titleStore.title != '' ? titleStore.title : route.meta.title }}</div>
                        <router-link to="/templates" class="btn btn-small subtitle" v-if="showBackBtn()"><SvgIcon name="arrow-back" /> Go back</router-link>
                        <div class="subtitle" v-if="!showBackBtn()">{{ titleStore.subtitle != '' ? titleStore.subtitle : route.meta.subtitle }}</div>
                    </div>
                    <div v-if="isActiveRoute('/templates')" class="col-right df gap16">
                        <router-link to="/request" class="btn ghost" v-if="!isActiveRoute('/request')"><SvgIcon name="request-template" /> Request a template</router-link>
                        <a href="https://opensubmitter.com/submit-template" target="_blank" class="btn ghost" v-if="!isActiveRoute('/request')"><SvgIcon name="add-file" /> Submit a template</a>
                    </div>
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
import SvgIcon from "../components/SvgIcon.vue"
import {onMounted, onUpdated, ref} from "vue";
import {useTitleStore} from "../composables/titles";
import {useAPI} from "../composables/api";
const titleStore = useTitleStore();
const route = useRoute()
const api = useAPI()

const isActiveRoute = (routePath: string): boolean => {
    return route.path === routePath;
};
const showBackBtn = (): boolean => {
    if (isActiveRoute('/template') || isActiveRoute('/request')) {
        return true;
    } else {return false;}
}
function isDevelopmentEnv(): boolean {
    return typeof process.env !== "undefined" && typeof process.env.NODE_ENV !== "undefined" && process.env.NODE_ENV === "development";
}

onMounted(() => {
    api.getUpdates();
})

</script>

<style lang="less" scoped>
@import '../assets/css/vars.less';

@sidebarWidth: 256px;
@headerHeight: 120px;
.update-available {
    border-radius: 8px;
    border: 2px solid #00C9CD;
    padding: 16px;
    margin: 24px;
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    .title {
        font-size: 18px;
        margin-bottom: 16px;
    }
}
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
    width: @sidebarWidth;
    margin-right: 0px;
    padding-top: 32px;
    position: fixed;
    height: 100vh;
    z-index: 10;
}
.col-main {
    flex: 1;
    padding-top: @headerHeight;
    padding-left: @sidebarWidth;
}
.col-content {
    padding: 40px;
    background: #162828;
}
.col-header {
    height: @headerHeight;
    display: flex;
    align-items: center;
    padding: 0 40px;
    background: #182E2E;
    position: fixed;
    left: @sidebarWidth;
    right: 0;
    top: 0;
    z-index: 10;
    .title {
        font-size: 24px;
    }
    .subtitle {
        font-size: 13px;
        margin-top: 10px;
        opacity: 0.7;
    }
    .col-right {
        margin-left: auto;
    }
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
