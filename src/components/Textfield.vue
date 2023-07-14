<template>
    <div class="textfield" :class="{error : errorMessage}">
        <input
            type="text"
            :value="modelValue"
            @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
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
    input {
        background: #101919;
        color: #fff;
        border: 1px solid #354545;
        border-radius: 6px;
        font-family: inherit;
        font-size: 16px;
        height: 40px;
        width: 100%;
        display: block;
        padding: 0 6px;
    }
}
.form-settings .textfield input {width: 310px;}
.error-msg {
    margin-top: 4px;
    font-size: 12px;
    color: @textError;
}
</style>