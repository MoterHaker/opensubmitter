<template>
    <div>
        <div class="block-search">
            <div class="df gap32">
                <Textfield />
                <Btn ghost="true" label="Submit template" />
            </div>
            <div class="tags df gap8">
                Try tags:
                <div class="tag">Accounts Generator</div>
                <div class="tag">Submitter</div>
            </div>
        </div>

        <div class="templates-list">
            <template-item />
        </div>
    </div>
</template>
<script setup lang="ts">
    import Textfield from "../components/Textfield.vue"
    import Btn from "../components/Btn.vue"
    import TemplateItem from "../components/TemplateItem.vue"
</script>
<style lang="less" scoped>
.templates-list {
    margin-top: 32px;
}
.block-search {
    .textfield {width: 300%;}
}
.tags {
    font-size: 13px;
}
</style>