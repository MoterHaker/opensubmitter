<template>
  <div>
      <div class="settings-title">Captcha Solving Service</div>
      <div class="textfield-button">
          <div class="hg2"><a href="https://anti-captcha.com/clients/settings/apisetup" target="_blank">Anti-Captcha</a> API key</div>
          <textfield v-model="store.AntiCaptchaAPIKey" @update:modelValue="store.requestAntiCaptchaBalance()" :error-message="store.AntiCaptchaErrorString" style="width:100%"/>
          <div class="mtop5"><span v-if="store.isAntiCaptchaAPIKeyValid" :class="{ 'error-balance': parseInt(store.AntiCaptchaBalance) < 0.01 }">Balance: ${{store.AntiCaptchaBalance}}</span></div>
      </div>

      <!--<div class="settings-title">SMS Receiving Services</div>
      <div class="textfield-button">
          <div class="hg2"><a href="https://grizzlysms.com/registration?r=340663" target="_blank">GrizzlySMS</a> API key</div>
          <textfield v-model="store.GrizzlySMSAPIKey" @update:modelValue="store.requestGrizzlySMSBalance()" :error-message="store.GrizzlySMSErrorString" style="width:100%"/>
          <div class="mtop5"><span v-if="store.isGrizzlySMSAPIKeyValid" :class="{ 'error-balance': parseInt(store.GrizzlySMSBalance) < 0.01 }">Balance: ₽{{store.GrizzlySMSBalance}}</span></div>
      </div>-->
  </div>
</template>

<script setup lang="ts">

import {onBeforeMount, ref} from "vue";
import { ipcRenderer } from 'electron'
import Textfield from "../components/Textfield.vue";
import Btn from "../components/Btn.vue";
import {useSettingsStore} from "../composables/settings";

const store = useSettingsStore();

onBeforeMount(() => {
    ipcRenderer.send('TM', {
        type: 'get-settings'
    });
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
.settings-title {
    font-size: 16px;
    padding: 20px 0 10px;
}
.settings-title:first-child {
    padding: 0 0 10px;
}
</style>