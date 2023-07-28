<template>
    <div class="dib left">{{props.left}}</div>
    <div @click="emits('update', !props.state)" class="toggler btn" :class="{on: props.state}">
        <div class="checkbox"></div>
        <div class="title"></div>
    </div>
    <div class="dib right">{{props.right}}</div>
</template>

<script setup lang="ts">
const props = defineProps(['state', 'left', 'right'])
const emits = defineEmits(['update'])
</script>

<style lang="less" scoped>
@import '../assets/css/vars.less';
.dib {
    display: inline-block;
    position: relative;
    bottom: 8px;
}
.left {
    margin-right: 10px;
}
.right {
    margin-left: 10px;
}
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