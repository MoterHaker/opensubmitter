import { app } from 'electron'
import { join } from 'node:path'
import os, {tmpdir} from 'os';
import fs from "fs";
import { isDevelopmentEnv } from "./functions"

const puppeteerVersion = '114.0.5735.133';

let isTCRead = false;
let templateControllerContent;

export const pathsConfig = () => {

    //got it from puppeteer/browser/src/detectPlatform.ts
    const isWindows11 = (version: string): boolean => {
        const parts = version.split('.');
        if (parts.length > 2) {
            const major = parseInt(parts[0] as string, 10);
            const minor = parseInt(parts[1] as string, 10);
            const patch = parseInt(parts[2] as string, 10);
            return (
                major > 10 ||
                (major === 10 && minor > 0) ||
                (major === 10 && minor === 0 && patch >= 22000)
            );
        }
        return false;
    }


    const puppeteerExecutablePath = (): string => {

        let executablePath = '';

        // const slash = process.platform === 'win32' ? "\\" : '/';

        switch (process.platform) {
            case 'darwin':
                if (process.arch === 'arm64') {
                    executablePath = `mac_arm-${puppeteerVersion}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
                } else {
                    executablePath = `mac-${puppeteerVersion}/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
                }
                break;

            case 'linux':
                executablePath = `linux-${puppeteerVersion}/chrome-linux64/chrome`;
                break;

            case 'win32':
                if (process.arch === 'x64' || (os.arch() === 'arm64' && isWindows11(os.release()))) {
                    executablePath = `win64-${puppeteerVersion}\\chrome-win64\\chrome.exe`;
                } else {
                    executablePath = `win32-${puppeteerVersion}\\chrome-win32\\chrome.exe`;
                }
                break;
        }

        let result = isDevelopmentEnv() ?
            join(app.getAppPath(), 'extra', 'puppeteer', executablePath) :
            join(compiledTemplateDir, 'dist', 'puppeteer', executablePath);

        if (process.platform === 'win32') {
            //making double quotes, so it could work in the template variable %PUPPETEER_EXECUTABLE_PATH%
            result = result.replace(/\\/g, "\\\\");
        }

        return result;

    }

    const templatesDirectory = isDevelopmentEnv() ?
        join(__dirname, '..', '..', 'templates') :
        join(process.resourcesPath, 'templates');

    const templateControllerPath = isDevelopmentEnv() ?
        join(__dirname, '..','..', 'electron', 'main', 'templateController.ts') :
        join(process.resourcesPath, 'src', 'templateController.ts')

    const templateControllerSubmodulesPath = isDevelopmentEnv() ?
        join(__dirname, '..','..', 'electron', 'main', 'template-submodules') :
        join(process.resourcesPath, 'src', 'template-submodules')

    // const temporaryCompiledTemplatesDirectory = join(tmpdir(), 'opsub_compiled');
    // const temporaryCompiledTemplatesNodeModules = join(temporaryCompiledTemplatesDirectory, 'node_modules');

    if (!isTCRead) {
        let submodulesTS = null;
        const submodulesList = fs.readdirSync(templateControllerSubmodulesPath);
        for (const submodulePath of submodulesList) {
            submodulesTS += fs.readFileSync(join(templateControllerSubmodulesPath, submodulePath)).toString() + "\n\n";
        }

        templateControllerContent = submodulesTS + fs.readFileSync(templateControllerPath)
            .toString()
            .split("//cut")[1];
        isTCRead = true;
    }



    const compiledTemplateDir = join(tmpdir(), 'opsubcompiledcustom');
    if (!fs.existsSync(compiledTemplateDir)) fs.mkdirSync(compiledTemplateDir);

    const compiledTemplateNodeModules = join(compiledTemplateDir, 'node_modules');

    const compiledTemplateNodeModulesVersion = join(compiledTemplateNodeModules, 'version.txt')

    const extractor = isDevelopmentEnv() ?
        join(__dirname, '..', '..', 'electron', 'main', 'asarextractor.js') :
        join(process.resourcesPath, 'src', 'asarextractor.js')

    const asarExtractedNodeModules = join(compiledTemplateDir, 'dist', 'bundled-node-modules', 'modules')

    const settingsFile = isDevelopmentEnv() ?
        join(__dirname, '..', '..', 'templates', 'settings.json') :
        join(process.resourcesPath, 'templates', 'settings.json')

    const developmentNodeModules = join(app.getAppPath(), 'extra', 'bundled-node-modules', 'modules')

    const electronAssets = isDevelopmentEnv() ?
        join(__dirname, '..', '..', 'electron', 'main', 'assets') :
        join(process.resourcesPath, 'src', 'assets')

    let isNodeModulesExtracted = false;

    return {
        // constants:
        templatesDirectory,                     //path where we store templates
        templateControllerPath,                 //path to templateController.ts
        templateControllerSubmodulesPath,       //path to submodules of templateController.ts
        templateControllerContent,              //contents of the template controller
        compiledTemplateDir,                    //where we store "real" compiled templates
        compiledTemplateNodeModules,            //where we store node_modules for "real" compiled templates
        compiledTemplateNodeModulesVersion,     //path to version.txt file which indicates updates in node_modules
        isNodeModulesExtracted,                 //flag to indicate node_modules extraction completion
        asarExtractedNodeModules,               //path to extracted node_modules from app.asar archive
        extractor,                              //module which extracts data from app.asar
        settingsFile,                           //app settings storage file path
        developmentNodeModules,                 //location of extracted/node_modules for development mode
        electronAssets,                         //location of extra files for template APIs

        // methods:
        isDevelopmentEnv,
        puppeteerExecutablePath                 //defines puppeteer Chromium browser path
    }
}