<template>
    <table class="table-docs" v-if="resultTableHeader">
        <thead>
        <tr>
            <td v-for="row in resultTableHeader">
                {{row.title}}
            </td>
        </tr>
        </thead>
        <tbody v-if="resultsData.length == 0">
        <tr><td colspan="100" style="text-align: center">No results yet</td></tr>
        </tbody>
        <tbody v-if="resultsData.length > 0">
        <tr v-for="row in resultsData">
            <td v-for="property in row" :class="getResultCellPropertyClasses(property)">
                <span v-if="!property.isResult">{{ property.value }}</span>
                <span v-else>{{ property.value ? 'Success' : 'Failed' }}</span>
            </td>
        </tr>
        </tbody>
    </table>
</template>

<script setup lang="ts">

const props = defineProps<{
    resultTableHeader: ResultTableRow[] | null,
    resultsData: ResultTableRow[][]
}>();

function getResultCellPropertyClasses(property: ResultTableRow) {
    const res: any = {};
    if (typeof property.isResult === "boolean" && property.isResult) {
        res[property.value ? 'success' : 'error'] = true;
    }
    if (typeof property.nowrap === "boolean" && property.nowrap) {
        res['nowrap'] = true;
    } else {
        res['break-word'] = true;
    }
    return res;
}

</script>


<style lang="less">
.break-word span {
  white-space: pre-wrap;
  word-break: break-word;
}
.nowrap span {
  text-wrap: none;
}
.success {
  color: #00CD6B;
}
.error {
  color: red;
}
</style>