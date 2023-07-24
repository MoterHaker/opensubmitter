<template>
    <div>
        <div class="page-msg" v-if="reqSent">
            <img src="../assets/images/big-check.svg" alt="">
            <div class="title">Thank you, your request was sent</div>
            <router-link to="/templates"><Btn class="accent" label="OK" /></router-link>
        </div>
        <div class="form" v-if="!reqSent">
            <div class="form-row">
                <div class="flabel">Your email:</div>
                <textfield v-model="email" class="w50" placeholder=""></textfield>
            </div>
            <div class="form-row">
                <div class="flabel">Target website address:</div>
                <textfield v-model="address" class="w50" placeholder="https://..."></textfield>
            </div>
            <div class="form-row">
                <div class="flabel">Please describe what template should do:</div>
                <textarea cols="72" rows="6" class="textarea" v-model="message" placeholder="Describe your requirements here" />
            </div>
            <div class="form-row"><Btn @click="send()" label="Send request" /></div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import Btn from "../components/Btn.vue";
import {useAPI} from "../composables/api";
import Textfield from "../components/Textfield.vue";
const api = useAPI()
const reqSent = ref(false);

const email = ref('');
const address = ref('');
const message = ref('');

function send() {
    if (email.value.length < 5) {
        console.log('bad email')
        return;
    }
    if (address.value.indexOf('http') === -1) {
        console.log('bad address')
        return false;
    }
    if (message.value.length < 10) {
        console.log('bad message')
        return;
    }
    reqSent.value = true;
    api.requestNewTemplate(email.value, address.value, message.value);
}

</script>
<style lang="less" scoped>
</style>