<template>
  <div>
      <table class="table-docs max-height-300">
          <thead>
          <tr>
              <th class="thread-col">
                  Thread #
              </th>
              <th>
                  Status
              </th>
          </tr>
          </thead>
          <tbody class="">
          <tr v-for="status in props.statuses">
              <td class="thread-col">{{ (status as ThreadStatus).thread }}</td>
              <td>{{ (status as ThreadStatus).status }}</td>
          </tr>
          </tbody>
      </table>
  </div>
</template>

<script setup lang="ts">
/// <reference path="../../src/type.d.ts" />
import { PropType } from 'vue'
const props = defineProps({
  statuses: Array as PropType<ThreadStatus[]>
})
</script>

<style lang="scss" scoped>
.thread-col {
    width: 100px;
}
.max-height-300 {
  thead, tbody tr {
    display: table;
    width: 100%;
    table-layout: fixed;
  }
  tbody {
    display: block;
    max-height: 300px;
    overflow: auto;
  }
}
</style>