<template>
    <div>
<!--        <component :is="modalToShow" />-->
        <div class="df">
            <div class="col-side-nav">
                <router-link to="/dashboard">Task Manager</router-link>
                <router-link to="/templates">Templates</router-link>
                <router-link to="/uikit">UI kit</router-link>
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

<script setup>
import {useRoute} from "vue-router";

const route = useRoute()
</script>

<style lang="less" scoped>
@import '../assets/css/vars.less';

.col-side-nav {
    background: #151211;
    display: flex;
    flex-direction: column;
    width: 200px;
    margin-right: 0px;
    padding-right: 26px;
    padding-left: 40px;
    padding-top: 16px;
    a {
        padding: 16px 0;
        color: rgba(255,255,255,.6);
        text-decoration: none;
    &.router-link-exact-active {
          color: @selected;
          text-decoration: none;
        }
    }
}
.col-right {
    flex: 1;
}
.col-content {
    padding: 40px;
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
    background: #2f2826;
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
