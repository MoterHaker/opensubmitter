/// <reference path="./type.d.ts" />
import axios from "axios";
import {ref} from "vue"
import {ipcRenderer} from "electron";
import os from "os";

export const useAPI = () => {

    const apiErrorCode = ref('');
    const apiErrorTranslated = ref('');
    const appVersion = ref('');
    const isUpdateAvailable = ref(false)
    const updateLink = ref('');
    const newVersion = ref('');
    let versionUpdateInterval: any = null;

    const getTemplateCategories = async(): Promise<string[]> => {
        try {
            return (await fetchData('template/get_categories', { })).categories;
        } catch (e) {
            errorFallback('template/get_categories')
        }
        return [];
    }

    const requestNewTemplate = async(email: string, address: string, message: string): Promise<boolean> => {
        try {
            await fetchData('template/request', { email, address, message });
            return true;
        } catch (e) {
            errorFallback('template/request')
        }
        return false;
    }

    const downloadTemplate = async(id: number): Promise<TemplateContent | null> => {
        // const env = (process.env && process.env.NODE_ENV && process.env.NODE_ENV === "development") ? "development" : "production";
        const env = 'production';
        try {
            return await fetchData('template/download', { id, env, 'skipcount': true });
        } catch (e) {
            errorFallback('template/download')
        }
        return null;
    }

    const reportTemplateView = async(id: number): Promise<boolean> => {
        try {
            await fetchData('template/report_view', { id });
            return true;
        } catch (e) {
            errorFallback('template/report_view')
        }
        return false;
    }

    const reportTemplateRun = async(name: string): Promise<boolean> => {
        try {
            await fetchData('template/report_run', { name });
            return true;
        } catch (e) {
            errorFallback('template/report_run')
        }
        return false;
    }

    const searchTemplates = async(search: string, category: string): Promise<PublicTemplate[]> => {
        try {
            return (await fetchData('template/search', {search, category })).list;
        } catch (e) {
            errorFallback('template/search')
        }
        return [];
    }

    const getUpdates = (): void => {

        versionUpdateInterval = setInterval(async() => {
            if (!appVersion.value || appVersion.value === '') {
                console.log('version is empty');
                return;
            }

            let platform = '';
            switch (process.platform) {
                case 'darwin':
                    if (process.arch === 'arm64') {
                        platform = 'mac_arm'
                    } else {
                        platform = 'mac'
                    }
                    break;

                case 'linux':
                    platform = 'linux'
                    break;

                case 'win32':
                    if (process.arch === 'x64') {
                        platform = 'windows'
                    }
                    if (os.arch() === 'arm64') {
                        platform = 'windows_arm';
                    }
                    break;
            }

            if (platform === '') {
                console.error('could not detect the platform')
                clearInterval(versionUpdateInterval)
            }

            try {
                const remoteVersion = (await fetchData('app/get_updates', { platform })).version;
                if (remoteVersion.version !== appVersion.value) {
                    updateLink.value = remoteVersion.download_url;
                    newVersion.value = remoteVersion.version;
                    isUpdateAvailable.value = true;
                }
                clearInterval(versionUpdateInterval)
            } catch (e) {
                errorFallback('app/get_updates')
            }
        }, 5000);
    }

    ipcRenderer.on('NetworkAPI', (e, data) => {
        switch (data.type) {

            case 'set-version':
                appVersion.value = data.version;
                break;
        }
    });

    const fetchData = async (path: string, postData: any): Promise<any> => {

        // const isDevelopment = process.env && process.env.NODE_ENV && process.env.NODE_ENV === "development";
        let baseUrl = 'https://opensubmitter.com/api/';
        // if (isDevelopment) {
        //     baseUrl = 'http://127.0.0.1:9005/api/'
        // }


        const result = await axios.post(baseUrl + path, postData, {
                headers: {
                    Accept: 'Accept: application/json'
                }
            }
        );
        if (!result.data.status) {
            throw new Error("No status response");
        }
        if (result.data.status === 'failed') {
            setAPIError(result.data.message);
            throw new Error(result.data.message);
        }
        if (result.data.status === 'success') {
            return result.data;
        } else {
            throw new Error("Uknown API response code");
        }
    }

    const errorFallback = (path: string) => {
        console.error('Could not query backend');
    }

    const setAPIError = (code: string): void => {
        if (code != 'OK') apiErrorCode.value = code;
        else apiErrorCode.value = '';
        switch (code) {

            case "OK":
                apiErrorTranslated.value = '';
                break;

            case 'ERROR_TEMPLATE_KEY_NOT_FOUND':
                apiErrorTranslated.value = "Template as not found";
                break;

            case 'ERROR_EMAIL_ALREADY_CONFIRMED':
                apiErrorTranslated.value = "Template's email has been already confirmed";
                break;

            case 'ERROR_TEMPLATE_ALREADY_EXISTS':
                apiErrorTranslated.value = "Template with this name already exists";
                break;

            case 'ERROR_IMPORTING_TEMPLATE':
                apiErrorTranslated.value = "Could not import the template. Make sure it is written in Typescript and implements \"OpenSubmitterTemplateProtocol\" interface";
                break;

            case 'ERROR_NO_CONFIG':
                apiErrorTranslated.value = "Template has no config object. Please refer to our documentation and examples.";
                break;

            case 'ERROR_NO_NAME':
                apiErrorTranslated.value = "Template has no config.name property";
                break;

            case 'ERROR_NO_DESCRIPTION':
                apiErrorTranslated.value = "Template has no config.description property";
                break;

            case 'ERROR_CONNECTION':
                apiErrorTranslated.value = "Error connecting to remote backend";
                break;

            default:
                apiErrorTranslated.value = "Got remote error: "+code;
                break;
        }


    }

    return {
        // refs:
        apiErrorTranslated,
        appVersion,
        isUpdateAvailable,
        updateLink,
        newVersion,

        // methods:
        getUpdates,
        searchTemplates,
        reportTemplateView,
        reportTemplateRun,
        downloadTemplate,
        getTemplateCategories,
        requestNewTemplate
    }

}