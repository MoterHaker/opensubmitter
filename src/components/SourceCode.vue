<template>
    <div class="source-code">
        <div class="body">
            <pre :class="{'loading' : props.isLoading} ">{{code}}</pre>
        </div>
    </div>
</template>

<script setup lang="ts">

const props = defineProps<{
    code: string,
    isLoading: boolean
}>();

</script>

<style lang="less">
.loading {
    position: relative;
    z-index: 1;
    color: rgba(255,255,255,0);
    height: 30px;
    &::before {
        content: '';
        background-image: url('../assets/images/loader.png');
        background-repeat: no-repeat;
        background-size: contain;
        background-position: 50% 50%;
        top: 5px;
        bottom: 5px;
        position: absolute;
        display: block;
        left: 0;
        right: 0;
        animation: spinner 0.3s linear infinite;
    }
}
.source-code {
    background-color: #101919;
    border-radius: 8px;
    border: 1px solid #354545;
    display: grid;
    grid-template-columns: 1fr;
    overflow: hidden;
}
.body {
    padding: 8px 16px;
    font-size: 14px;
    overflow: auto;
}



.hljs {
    color: #abb2bf;
    background: #282c34;
}

.hljs-comment,
.hljs-quote {
    color: #5c6370;
    font-style: italic;
}

.hljs-doctag,
.hljs-keyword,
.hljs-formula {
    color: #c678dd;
}

.hljs-section,
.hljs-name,
.hljs-selector-tag,
.hljs-deletion,
.hljs-subst {
    color: #e06c75;
}

.hljs-literal {
    color: #56b6c2;
}

.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta .hljs-string {
    color: #98c379;
}

.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-number {
    color: #d19a66;
}

.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-meta,
.hljs-selector-id,
.hljs-title {
    color: #61aeee;
}

.hljs-built_in,
.hljs-title.class_,
.hljs-class .hljs-title {
    color: #e6c07b;
}

.hljs-emphasis {
    font-style: italic;
}

.hljs-strong {
    font-weight: bold;
}

.hljs-link {
    text-decoration: underline;
}
</style>