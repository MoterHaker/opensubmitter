<template>
    <div class="textfield" :class="{error : errorMessage}">
        <textarea
                ref="scrollingTextarea"
                :value="modelValue"
                :style="{ scrollTop: '100px', minHeight: '200px' }"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <div class="error-msg" v-if="errorMessage">
            {{ errorMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref, watch} from "vue";
const scrollingTextarea = ref(null);
defineEmits(['update:modelValue'])
const props = defineProps(['modelValue', 'errorMessage'])

watch(() => props.modelValue, (newValue) => {
    scrollingTextarea.value.scrollTop = scrollingTextarea.value.scrollHeight;
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