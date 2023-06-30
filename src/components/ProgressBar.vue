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

<style lang="css" scoped>
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin-top: 10px;
}

.progress-bar__container {
    width: 100%;
    height: 2rem;
    border-radius: 2rem;
    position: relative;
    overflow: hidden;
    transition: all 0.5s;
    will-change: transform;
    box-shadow: 0 0 5px #e76f51;
}

.progress-bar {
    position: absolute;
    height: 100%;
    width: 100%;
    content: "";
    background-color: #e76f51;
    top:0;
    bottom: 0;
    left: -100%;
    border-radius: inherit;
    display: flex;
    justify-content: center;
    align-items:center;
    color: white;
    font-family: sans-serif;
    transition-duration: 1s;
}

</style>