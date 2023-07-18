<template>
    <div>
        <div class="block-search">
            <div class="df gap16">
                <Textfield icon="search" placeholder="Search" />
                <Btn label="Find" />
            </div>
            <div class="tags df gap8">
                Try tags:
                <div class="tag">Accounts Generator</div>
                <div class="tag">Submitter</div>
            </div>
        </div>

        <div class="page-msg" v-if="noResult">
            <img src="../assets/images/no-result.svg" alt="">
            <div class="title">No results found</div>
            <div class="request-wrap df dir-col alitc gap16">
                <div class="text">Can't find a template which suits your needs?</div>
                <router-link to="/request" class="accent btn">Request a template</router-link>
            </div>
        </div>

        <div class="templates-list" v-if="!noResult">
            <template-item views="12,569" downloads="55,885" runs="122,556" />
            <template-item views="321" downloads="535" runs="8,547" />
        </div>
    </div>
</template>
<script setup lang="ts">
    import Textfield from "../components/Textfield.vue"
    import Btn from "../components/Btn.vue"
    import TemplateItem from "../components/TemplateItem.vue"
    const noResult = true
</script>
<style lang="less" scoped>
.request-wrap {
    font-size: 24px;
}
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