<template>
    <button class="btn" :class="{
        'disabled': props.disabled,
        'loading': props.loading,
        'ghost': props.ghost
    }"><svg-icon v-if="typeof icon !== 'undefined'" :name="icon" />{{ props.label }}</button>
</template>

<script setup lang="ts">
    import SvgIcon from "./SvgIcon.vue"
    const props = defineProps(['label', 'disabled', 'loading', 'ghost', 'icon'])
</script>