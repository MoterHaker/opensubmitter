<template>
    <div class="textfield" :class="{error : errorMessage}">
        <textarea
                ref="scrollingTextarea"
                :value="modelValue"
                :style="styling"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <div class="error-msg" v-if="errorMessage">
            {{ errorMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref, watch} from "vue";
interface Scrollable {
    scrollHeight: number
}
const scrollingTextarea = ref(null);
const styling = ref({ scrollTop: '100px', minHeight: '200px' })
defineEmits(['update:modelValue'])
const props = defineProps(['modelValue', 'errorMessage'])

watch(() => props.modelValue, (newValue) => {
    styling.value.scrollTop = (scrollingTextarea.value! as Scrollable).scrollHeight + 'px';
})
</script>

<style lang="less" scoped>
@import '../assets/css/vars.less';
.textfield {
  &.short input {width: 6ch !important;}
  &.error {
    input {
      border-color: @textError;
    }
  }
  textarea {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.17);
    border-radius: 6px;
    font-family: 'Montserrat', sans-serif;
    font-size: 16px;
    height: 40px;
    width: 100%;
    display: block;
    padding: 0 6px;
  }
}
</style>