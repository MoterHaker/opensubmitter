import { defineStore } from 'pinia'
import {ref, watch} from "vue";
import { ipcRenderer } from 'electron'


export const useSettingsStore = defineStore('settings', () => {

    const updateInterval = ref<any>(null);
    const AntiCaptchaAPIKey = ref('')
    const isAntiCaptchaAPIKeyValid = ref(false);
    const AntiCaptchaBalance = ref('--.--')
    const AntiCaptchaErrorString = ref<string | null>('');

    function requestAntiCaptchaBalance() {
        clearInterval(updateInterval.value)
        updateInterval.value = setTimeout(() => {
            ipcRenderer.send('TM', {
                type: 'save-settings',
                antiCaptchaAPIKey: AntiCaptchaAPIKey.value
            });
        }, 500);
    }


    ipcRenderer.on('Settings', (e, data) => {
        switch (data.type) {

            case 'set-settings':
                const settings = data.settings;
                if (settings.antiCaptchaAPIKey) {
                    AntiCaptchaAPIKey.value = settings.antiCaptchaAPIKey;
                    isAntiCaptchaAPIKeyValid.value = true;

                    // triggers balance update
                    ipcRenderer.send('TM', {
                        type: 'check-anti-captcha-balance',
                        key: AntiCaptchaAPIKey.value
                    });
                }
                break;

            case 'set-balance-value':
                AntiCaptchaBalance.value = data.balance;
                isAntiCaptchaAPIKeyValid.value = true;
                AntiCaptchaErrorString.value = null;
                break;

            case 'set-key-error':
                isAntiCaptchaAPIKeyValid.value = false;
                AntiCaptchaErrorString.value = "Invalid key: "+data.message;
                break;
        }
    })

    return {
        // refs:
        AntiCaptchaAPIKey,
        isAntiCaptchaAPIKeyValid,
        AntiCaptchaBalance,
        AntiCaptchaErrorString,

        // methods:
        requestAntiCaptchaBalance
    }

});