<script>
import { defineAsyncComponent } from 'vue';

export default {
  props: {
    name: {
      type: String,
      required: true,
    },
  },

  computed: {
    dynamicComponent() {
      const name = this.name;
      return defineAsyncComponent(() => import(`./icons/${name}.vue`));
    },
  },
};
</script>

<template>
  <span v-if="typeof this.name !== 'undefined'"><component :is="dynamicComponent" /></span>
</template>