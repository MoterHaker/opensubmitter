<template>
    <button class="btn-icon">
        <svg-icon :icon="iconObject" :class-name="className"></svg-icon>
    </button>
</template>

<script setup lang="ts">
import {onBeforeMount, onMounted, shallowRef} from "vue";
import SvgIcon from "./SvgIcon.vue";
import IconCopy from '../assets/icons/copy.svg'
import IconCheck from '../assets/icons/check.svg'
interface Props {
    icon: string
    className: string
}

const props = withDefaults(defineProps<Props>(), {
    icon: '',
    className: () => 'icon16'
})
const iconObject = shallowRef({});

onBeforeMount(() => {
    switch (props.icon) {
        case 'copy':
            iconObject.value = IconCopy;
            break;
        case 'check':
            iconObject.value = IconCheck;
            break;
    }
})

</script>

<style lang="less">
.btn-icon {
    width: auto;
    height: auto;
    padding: 5px;
    background: none;
    flex-shrink: 0;
    color: currentColor;
    svg {display: block;}
    .icon {margin-right: 0;}
    &.cir {
        background-color: #5A5C68;
        border-radius: 50%;
        padding: 8px;
    }
}
</style>