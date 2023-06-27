<template>
    <div class="tab-item"><slot /></div>
</template>

<style lang="less" scoped>
.tab-item {
    display: none;
    &.active {display: block;}
}
</style>