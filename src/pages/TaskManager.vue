<template>
    <div class="dashboard">
        1Task Manager<br>
        2Task Manager<br>
        3Task Manager<br>
        4Task Manager<br>
        5Task Manager<br>
        6Task Manager<br>
    </div>
</template>

<script setup>
import { ref } from 'vue'

import {onMounted} from "vue";
onMounted(() => {
    console.log('mounted task manager')
})
</script>

<style lang="less">


.dashboard {
    .va-card {
        margin-bottom: 0 !important;
    }
}
</style>
