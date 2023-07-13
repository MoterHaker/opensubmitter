const puppeteer = require("@puppeteer/browsers");
const fs = require("fs");

// import { join } from 'node:path'

(async() => {
    const { join } = await import('node:path')
    const buildId = '114.0.5735.133'

    const platforms = [
        'win32', 'win64', 'mac', 'linux', 'mac_arm'
    ];

    for (const platform of platforms) {

        const targetDir = join(__dirname, "../public/puppeteer", `${platform}-${buildId}`);
        if (fs.existsSync(targetDir)) {
            console.log(`directory ${targetDir} already exists, skipping download for ${platform}`)
            continue
        }
        console.log('downloading for', platform)

        await puppeteer.install({
            cacheDir: join(__dirname, "../public/puppeteer", platform),
            browser: 'chrome',
            platform,
            buildId
        });

        console.log('moving', join(__dirname, "../public/puppeteer", platform, "chrome", `${platform}-${buildId}`), 'to', join(__dirname, "../public/puppeteer", `${platform}-${buildId}`))
        fs.renameSync(join(__dirname, "../public/puppeteer", platform, "chrome", `${platform}-${buildId}`), targetDir)
        fs.rm(join(__dirname, "../public/puppeteer", platform), { recursive: true }, () => {})
    }

    console.log("done");
})();
