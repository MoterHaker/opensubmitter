<template>
    <img :width="width" :height="height" class="cir-loader" src="../assets/images/loader.png" alt="">
</template>

<script setup lang="ts">
    const props = defineProps(['width', 'height']);
</script>

<style scoped lang="less">
.cir-loader {
    animation: spinner 0.3s linear infinite;
}
</style>