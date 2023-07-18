<template>
    <div class="source-code">
        <div class="body">
            <pre>{{ code }}</pre>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
const props = defineProps(['code'])
</script>

<style lang="less">
.source-code {
    background-color: #101919;
    border-radius: 8px;
    border: 1px solid #354545;
    display: grid;
    grid-template-columns: 1fr;
    overflow: hidden;
}
.body {
    padding: 8px 16px;
    font-size: 14px;
    overflow: auto;
}
</style>