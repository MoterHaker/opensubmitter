<template>
    <button class="btn" :class="{
        'disabled': props.disabled,
        'loading': props.loading,
        'ghost': props.ghost
    }">{{ props.label }}</button>
</template>

<script setup lang="ts">
const props = defineProps(['label', 'disabled', 'loading', 'ghost'])
</script>