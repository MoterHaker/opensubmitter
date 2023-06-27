<template>
    <div @click="toggleState = !toggleState" class="toggler btn" :class="{on: toggleState}">
        <div class="checkbox"><svg-icon :icon="IconCheck" className="icon16" /></div>
        <div class="title">{{ toggleState ? 'On' : 'Off' }}</div>
    </div>
</template>

<script setup>
import SvgIcon from "./SvgIcon.vue";
import IconCheck from '../assets/icons/check.svg'
import {ref} from "vue";
const toggleState = ref(false);
</script>

<style lang="less" scoped>
@import '../assets/css/vars.less';
.toggler {
    padding-left: 3px;
    padding-right: 3px;
    background-color: #5A5C68;
}
.title {
    width: 50px;
    text-align: center;
    margin-left: 8px;
    margin-right: 8px;
    transition: transform 0.25s;
}
.checkbox {
    width: 34px;
    height: 34px;
    background-color: rgba(255,255,255,.23);
    border-radius: 4px;
    transition: all 0.25s;
    display: flex;
    align-items: center;
    justify-content: center;
    .icon16 {opacity: 0;}
}
.on {
    .checkbox {
        transform: translateX(66px);
        background-color: @selected;
        color: #000;
        .icon16 {opacity: 1;}
    }
    .title {
        transform: translateX(-34px);
    }
}
</style>