<script setup lang="ts">
import {useRouter} from "vue-router";
import {ipcRenderer} from "electron";
import {useTaskManagerStore} from "./composables/task-manager";
import {useSearchStore} from "./composables/search";

const router = useRouter()
router.push('/dashboard');

const taskManagerStore = useTaskManagerStore();
const searchStore = useSearchStore();

//global IPC hook for global stores
ipcRenderer.on('Global', (e, data) => {
    switch (data.type) {
        case 'set-template-file-list':
            taskManagerStore.localTemplatesList = data.list;
            break;
    }
})

//updating categories
searchStore.updateTemplateCategories();

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
