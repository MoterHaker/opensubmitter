<template>
  <div>
      <div class="subtitle" v-if="props.statuses?.length == 0">No active threads</div>
      <table class="table-docs max-height-300" v-if="props.statuses && props.statuses?.length > 0">
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
.subtitle {
    font-size: 12px;
}
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
    tr {margin-top: -1px;}
    &::-webkit-scrollbar {
      width: 16px;
    }
    &::-webkit-scrollbar-thumb {
        background: #334343;
        border: 3px solid #0A1010;
        border-radius: 100px;
    }
    &::-webkit-scrollbar-track {
        background: #0A1010;
        border-radius: 0 6px 6px 0;
    }
  }
}
</style>