<template>
  <div>
      <div class="textfield-button">
          <div class="hg2">Anti-Captcha API key</div>
          <textfield v-model="apiKey" @update:modelValue="requestBalance()" :error-message="errorString" style="width:100%"/>
          <div class="mtop5"><span v-if="apiKeyValid" :class="{ 'error-balance': parseInt(balance) < 0.01 }">Balance: ${{balance}}</span></div>
      </div>
  </div>
</template>

<script setup lang="ts">

import {onBeforeMount, ref} from "vue";
import { ipcRenderer } from 'electron'
import Textfield from "../components/Textfield.vue";
import Btn from "../components/Btn.vue";
const apiKey = ref('')
const apiKeyValid = ref(false);
const balance = ref('--.--')
const errorString = ref<string | null>(null)
let updateInterval: any = null;

function requestBalance() {
    clearInterval(updateInterval)
    updateInterval = setTimeout(() => {
        ipcRenderer.send('TM', {
            type: 'save-settings',
            antiCaptchaAPIKey: apiKey.value
        });
    }, 500);
}

onBeforeMount(() => {
    ipcRenderer.send('TM', {
        type: 'get-settings'
    });
})

ipcRenderer.on('Settings', (e, data) => {
    switch (data.type) {

        case 'set-settings':
            const settings = data.settings;
            if (settings.antiCaptchaAPIKey) {
                apiKey.value = settings.antiCaptchaAPIKey;
                apiKeyValid.value = true;
                ipcRenderer.send('TM', {
                    type: 'save-settings',
                    antiCaptchaAPIKey: apiKey.value
                });
            }
            break;

        case 'set-balance-value':
            balance.value = data.balance;
            apiKeyValid.value = true;
            errorString.value = null;
            break;

        case 'set-key-error':
            errorString.value = "Invalid key";
            apiKeyValid.value = false;
            break;
    }
})
</script>

<style>
.mtop5 {
    margin-top: 8px;
}
.error-balance {
    color: red;
    font-weight: bold;
}
</style>