/// <reference path="../../../templates/type.d.ts" />
//cut

class Anticaptcha {

    private config: TemplateConfig | null = null;
    protected antiCaptchaAPIKey: string = null;

    async solveCaptcha(captcha: Captcha): Promise<string | object> {
        const ac = require("@antiadmin/anticaptchaofficial");
        ac.setAPIKey(this.antiCaptchaAPIKey);
        ac.settings.softId = 1118;
        if (this.config.rewardTronAddress && this.config.rewardTronAddress.length > 0) {
            ac.settings.OSTronAddress = this.config.rewardTronAddress;
        }
        switch (captcha.type) {
            case 'image':
                if (!captcha.imageBodyBase64) {
                    throw new Error("Captcha body not set");
                }
                return await ac.solveImage(captcha.imageBodyBase64, true)

            case 'RecaptchaV2':
                if (captcha.extraParameters && captcha.extraParameters.recaptchaDataSValue) {
                    ac.settings.recaptchaDataSValue = captcha.extraParameters.recaptchaDataSValue;
                }
                if (!captcha.websiteURL || !captcha.websiteKey) {
                    throw new Error("Missing required captcha parameters");
                }

                if (this.isProxyParamsValid(captcha)) {
                    return await ac.solveRecaptchaV2ProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        captcha.extraParameters?.userAgent,
                        '',
                        typeof captcha.extraParameters?.isInvisible !== "undefined" ? captcha.extraParameters?.isInvisible : null);
                }

                return await ac.solveRecaptchaV2Proxyless(
                    captcha.websiteURL,
                    captcha.websiteKey,
                    typeof captcha.extraParameters?.isInvisible !== "undefined" ? captcha.extraParameters?.isInvisible : null);

            case 'RecaptchaV3':
                if (!captcha.websiteURL || !captcha.websiteKey || !captcha.extraParameters.v3score) {
                    throw new Error("Missing required captcha parameters");
                }
                return await ac.solveRecaptchaV3(
                    captcha.websiteURL,
                    captcha.websiteKey,
                    captcha.extraParameters.v3score,
                    captcha.extraParameters?.pageAction);

            case 'HCaptcha':
                if (!captcha.websiteURL || !captcha.websiteKey) {
                    throw new Error("Missing required captcha parameters");
                }
                let token;
                if (this.isProxyParamsValid(captcha)) {
                    token = await ac.solveHCaptchaProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        null, // UA is not required
                        '',
                        captcha.extraParameters?.enterprisePayload,
                        typeof captcha.extraParameters?.isInvisible !== "undefined" ? captcha.extraParameters?.isInvisible : null);
                } else {
                    token = await ac.solveHCaptchaProxyless(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        null, // UA is not required
                        captcha.extraParameters?.enterprisePayload,
                        typeof captcha.extraParameters?.isInvisible !== "undefined" ? captcha.extraParameters?.isInvisible : null);
                }
                const userAgent = ac.getHcaptchaUserAgent(); // UA is taken from the solving worker
                return {
                    token,
                    userAgent
                }

            case 'FunCaptcha':
                if (!captcha.websiteURL || !captcha.websiteKey) {
                    throw new Error("Missing required captcha parameters");
                }
                if (captcha.extraParameters && captcha.extraParameters.APISubdomain) {
                    ac.settings.funcaptchaApiJSSubdomain = captcha.extraParameters.APISubdomain;
                }
                if (captcha.extraParameters && captcha.extraParameters.APISubdomain) {
                    ac.settings.funcaptchaDataBlob = captcha.extraParameters.funcaptchaDataBlob;
                }

                if (this.isProxyParamsValid(captcha)) {
                    return await ac.solveFunCaptchaProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        captcha.extraParameters?.userAgent,
                        '');
                }

                return await ac.solveFunCaptchaProxyless(
                    captcha.websiteURL,
                    captcha.websiteKey);

            case 'Geetest3':
                if (!captcha.websiteURL ||
                    !captcha.websiteKey ||
                    !captcha.extraParameters.geetestChallenge) {
                    throw new Error("Missing required captcha parameters");
                }
                if (this.isProxyParamsValid(captcha)) {
                    return await ac.solveFunCaptchaProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.extraParameters.geetestChallenge,
                        captcha.extraParameters?.APISubdomain,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        captcha.extraParameters?.userAgent,
                        '');
                }
                return await ac.solveGeeTestProxyless(
                    captcha.websiteURL,
                    captcha.websiteKey,
                    captcha.extraParameters.geetestChallenge,
                    captcha.extraParameters?.APISubdomain);

            case 'Geetest4':
                if (!captcha.websiteURL ||
                    !captcha.websiteKey) {
                    throw new Error("Missing required captcha parameters");
                }
                if (this.isProxyParamsValid(captcha)) {
                    return await ac.solveGeeTestV4ProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.extraParameters?.APISubdomain,
                        captcha.extraParameters?.geetest4InitParameters,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        captcha.extraParameters?.userAgent,
                        '');
                }
                return await ac.solveGeeTestV4Proxyless(
                    captcha.websiteURL,
                    captcha.websiteKey,
                    captcha.extraParameters?.APISubdomain,
                    captcha.extraParameters?.geetest4InitParameters);
                break;

            case 'Turnstile':
                if (!captcha.websiteURL ||
                    !captcha.websiteKey) {
                    throw new Error("Missing required captcha parameters");
                }
                if (this.isProxyParamsValid(captcha)) {
                    return await ac.solveTurnstileProxyOn(
                        captcha.websiteURL,
                        captcha.websiteKey,
                        captcha.proxyType,
                        captcha.proxyAddress,
                        captcha.proxyPort,
                        captcha.proxyLogin,
                        captcha.proxyPassword,
                        captcha.extraParameters?.pageAction);
                }
                return await ac.solveGeeTestV4Proxyless(
                    captcha.websiteURL,
                    captcha.websiteKey,
                    captcha.extraParameters?.pageAction);
                break;

            case 'ImageToCoordinates':
                if (!captcha.imageBodyBase64) {
                    throw new Error("Captcha body not set");
                }
                if (!captcha.extraParameters.comment) {
                    throw new Error("No captcha comment specified");
                }
                return await ac.solveImageToCoordinates(captcha.imageBodyBase64, captcha.extraParameters.comment, captcha.extraParameters?.coordinatesMode)

        }
        throw new Error("Unsupported captcha type")
    }

    isProxyParamsValid(captcha: Captcha) {
        if (!captcha.proxyAddress || !captcha.proxyPort || !captcha.proxyType) return false;
        if (captcha.proxyPort < 80) return false;
        if (captcha.proxyAddress.split(".").length !== 4) return false;
        return true;
    }

}