<script setup lang="ts">
import {useRouter} from "vue-router";

const router = useRouter()
router.push('/dashboard');
import HelloWorld from './components/HelloWorld.vue'

console.log("[App.vue]", `Hello world from Electron ${process.versions.electron}!`)
</script>

<template>
    <router-view />
</template>

<style lang="less">
@import 'assets/css/global.less';
@import 'assets/css/vars.less';
body {
    margin: 0;
}
</style>
