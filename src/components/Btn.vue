<template>
    <button class="btn">{{ props.label }}</button>
</template>

<script setup>
const props = defineProps(['label'])
</script>