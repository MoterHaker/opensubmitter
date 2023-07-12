<template>
    <div class="container">
        <div class="progress-bar__container">
            <div class="progress-bar" :style="{ transform: 'translate('+props.percents+'%, 0px)' }">
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import {computed} from "vue";
const props = defineProps(['percents'])

// const transformStyle = computed(() => {
//     style = () => {
//         return 'transform: translate('+props.percents+'%, 0px); '
//     }
// })

</script>

<style lang="less" scoped>
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin-top: 10px;
}

.progress-bar__container {
    width: 100%;
    height: 16px;
    border-radius: 2rem;
    position: relative;
    overflow: hidden;
    transition: all 0.5s;
    will-change: transform;
    background: #071F1F;
    box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.13) inset, 0px 1px 0px 0px rgba(255, 255, 255, 0.04);
    &::after {
        content: "";
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 100px;
        // border: 1px solid #071F1F;
        z-index: 2;
        left: 0;
        top: 0;
        box-shadow: 0px 0px 0 1px #071F1F inset;
    }
}

.progress-bar {
    position: absolute;
    z-index: 1;
    background: linear-gradient(90deg, #00CD6B 0%, #00C9CD 100%);
    width: 100%;
    top:0;
    bottom: 0;
    left: -100%;
    border-radius: inherit;
    /* border: 1px solid #071F1F; */
    display: flex;
    justify-content: center;
    align-items:center;
    color: white;
    font-family: sans-serif;
    transition-duration: 1s;
}

</style>