<template>
    <div>
        <div class="block-search">
            <div class="df gap32">
                <Textfield icon="search" placeholder="Search" />
                <Btn icon="add-file" ghost="true" label="Submit a template" />
            </div>
            <div class="tags df gap8">
                Try tags:
                <div class="tag">Accounts Generator</div>
                <div class="tag">Submitter</div>
            </div>
        </div>

        <div class="templates-list">
            <template-item views="12,569" downloads="55,885" runs="122,556" />
            <template-item views="321" downloads="535" runs="8,547" />
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
    gap: 16px;
    display: flex;
    flex-direction: column;
}
.block-search {
    .textfield {flex: 1;}
}
.tags {
    font-size: 13px;
    margin-top: 8px;
    display: flex;
    align-items: center;
    .tag {
        background: #2B3E3E;
        border-radius: 4px;
        padding: 4px 8px;
        color: #fff;
        cursor: pointer;
        &:hover {
            background: #3B4E4E;
        }
    }
}
</style>