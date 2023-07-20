<template>
    <div class="textfield" :class="{error : errorMessage}">
        <pre
                ref="scrollingTextarea"
                :value="modelValue"
                :style="styling"
                class="joblog"
        >{{ props.modelValue }}</pre>
        <div class="error-msg" v-if="errorMessage">
            {{ errorMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref, watch} from "vue";
interface Scrollable {
    scrollHeight: number,
    scrollTop: number
}
const scrollingTextarea = ref(null);
const styling = ref({ scrollTop: '10px', minHeight: '200px' })
defineEmits(['update:modelValue'])
const props = defineProps(['modelValue', 'errorMessage'])

watch(() => props.modelValue, (newValue) => {
    (scrollingTextarea.value! as Scrollable).scrollTop = (scrollingTextarea.value! as Scrollable).scrollHeight;
})
</script>

<style lang="less" scoped>
@import '../assets/css/vars.less';
.joblog {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    border: 1px solid #354545;
    border-radius: 6px;
    font-size: 13px;
    display: block;
    padding: 8px 16px 16px;
    line-height: 1.4;
    max-height: 138px;
    overflow: auto;
    max-width: 100%;
    white-space: pre-wrap;
    word-break: break-word;
}

</style>