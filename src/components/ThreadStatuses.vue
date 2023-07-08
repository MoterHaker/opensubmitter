<template>
  <div>
      <ul>
          <li v-for="status in props.statuses">
              {{ (status as ThreadStatus).thread }}: {{ (status as ThreadStatus).status }}
          </li>
      </ul>
  </div>
</template>

<script setup lang="ts">
/// <reference path="../../src/interfaces-app.d.ts" />
import { PropType } from 'vue'
const props = defineProps({
  statuses: Array as PropType<ThreadStatus[]>
})
</script>