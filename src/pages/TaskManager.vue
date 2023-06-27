<template>
    <div class="dashboard">
        Task Manager
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
