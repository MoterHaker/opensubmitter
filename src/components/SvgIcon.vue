<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue';

const props = defineProps(['name']);
const dynamicComponent = computed(() => {
    return defineAsyncComponent(() => import(`./icons/${props.name}.vue`));
})

</script>

<template>
  <span v-if="typeof props.name !== 'undefined'"><component :is="dynamicComponent" /></span>
</template>