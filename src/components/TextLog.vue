<template>
    <div class="textfield" :class="{error : errorMessage}">
        <textarea
                :value="modelValue"
                :style="{ minHeight: '200px' }"
                @input="$emit('update:modelValue', $event.target?.value)"
        />
        <div class="error-msg" v-if="errorMessage">
            {{ errorMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">

defineEmits(['update:modelValue'])
defineProps(['modelValue', 'errorMessage'])
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