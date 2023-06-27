<template>
    <div class="textfield" :class="{error : errorMessage}">
        <input
            type="text"
            :value="value"
            @input="$emit('input', $event.target.value)"
        />
        <div class="error-msg" v-if="errorMessage">
            {{ errorMessage }}
        </div>
    </div>
</template>

<script>
export default {
    props: {
        type: {type: String},
        error: {type: Boolean},
        errorMessage: {type: String},
        value: {type: String}
    }
}
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
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        // border: 1px solid rgba(255, 255, 255, 0.17);
        border: 1px solid #6A6AC2;
        border-radius: 6px;
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        height: 40px;
        width: 100%;
        display: block;
        padding: 0 6px;
    }
}
.form-settings .textfield input {width: 310px;}
// .topup-amount .textfield input {border-color: #8C8CE5;}
.error-msg {
    margin-top: 4px;
    font-size: 12px;
    color: @textError;
}
</style>