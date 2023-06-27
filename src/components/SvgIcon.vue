<template>
    <svg :class="className">
        <component :is="Object(icon)"></component>
    </svg>
</template>

<script setup lang="ts">
interface Props {
    icon: Object
    className?: string

}

const props = withDefaults(defineProps<Props>(), {
    className: () => 'icon16'
})
</script>