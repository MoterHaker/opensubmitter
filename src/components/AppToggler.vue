<template>
    <div @click="toggleState = !toggleState" class="toggler btn" :class="{on: toggleState}">
        <div class="checkbox"><svg-icon :icon="IconCheck" className="icon16" /></div>
        <div class="title">{{ toggleState ? 'On' : 'Off' }}</div>
    </div>
</template>

<script setup lang="ts">
import SvgIcon from "./SvgIcon.vue";
import IconCheck from '../assets/icons/check.svg'
import {ref} from "vue";
const toggleState = ref(false);
</script>

<style lang="less" scoped>
@import '../assets/css/vars.less';
.toggler {
    padding-left: 6px;
    padding-right: 6px;
    background-color: #244242;
    box-shadow: 0px 0px 2px 1.5px rgba(0, 0, 0, 0.15) inset;
    border: 1px solid #1A2424;
}
.title {
    width: 50px;
    text-align: center;
    margin-left: 8px;
    margin-right: 8px;
    transition: transform 0.25s;
}
.checkbox {
    width: 28px;
    height: 28px;
    background-color: #426161;
    border-radius: 3px;
    transition: all 0.25s;
    display: flex;
    align-items: center;
    justify-content: center;
    .icon16 {opacity: 0;}
}
.on {
    .checkbox {
        transform: translateX(66px);
        background-color: #01CCCF;
        color: #000;
        .icon16 {opacity: 1;}
    }
    .title {
        transform: translateX(-28px);
    }
}
</style>