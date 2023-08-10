<template>
    <div class="textfield" :class="{error : errorMessage}">
        <textarea
            :value="modelValue"
            @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            :placeholder="placeholder"
        ></textarea>
        <div class="error-msg" v-if="errorMessage">
            {{ errorMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
defineEmits(['update:modelValue'])
defineProps(['modelValue', 'errorMessage', 'placeholder'])
</script>

<style lang="less" scoped>
@import '../assets/css/vars.less';

.textfield {
    &.error {
        textarea {
            border-color: @textError;
        }
    }
    textarea {
        background: #101919;
        color: #fff;
        border: 1px solid #354545;
        border-radius: 6px;
        font-family: inherit;
        font-size: 16px;
        height: 40px;
        width: 100%;
        display: block;
        padding: 6px;
        height: 300px;
        &::placeholder {
            color: #426666;
        }
    }
}
.form-settings .textfield textarea {
    width: 100%;
}
.error-msg {
    margin-top: 4px;
    font-size: 12px;
    color: @textError;
}
</style>