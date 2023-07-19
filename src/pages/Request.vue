<template>
    <div>
        <div class="page-msg" v-if="reqSent">
            <img src="../assets/images/big-check.svg" alt="">
            <div class="title">Thanks, request was sent</div>
            <Btn @click="reqSent = false" class="accent" label="OK" />
        </div>
        <div class="form" v-if="!reqSent">
            <div class="form-row">
                <div class="flabel">Please describe which template do you need:</div>
                <textarea cols="72" rows="6" class="textarea" placeholder="Describe your template here" />
            </div>
            <div class="form-row"><Btn @click="reqSent = true" label="Send request" /></div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import Btn from "../components/Btn.vue";

const reqSent = ref(false);
</script>
<style lang="less" scoped>
</style>