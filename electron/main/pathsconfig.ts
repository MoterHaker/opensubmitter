import { app } from 'electron'
import { join } from 'node:path'
import os, {tmpdir} from 'os';
import fs from "fs";

const puppeteerVersion = '114.0.5735.133';

export const pathsConfig = () => {

    const isDevelopmentEnv = (): boolean => {
        return process.env && process.env.NODE_ENV && process.env.NODE_ENV === "development";
    }

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
                executablePath = `linux-${puppeteerVersion}/chrome-linux/chrome`;
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
            join(asarExtractedDirectory, 'dist', 'puppeteer', executablePath);

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

    const temporaryCompiledTemplatesDirectory = join(tmpdir(), 'opsub_compiled');
    const temporaryCompiledTemplatesNodeModules = join(temporaryCompiledTemplatesDirectory, 'node_modules');

    const templateControllerContent = fs.readFileSync(templateControllerPath)
        .toString()
        .split("//cut")[1];

    const compiledTemplateDir = join(tmpdir(), 'opsubcompiledcustom');
    if (!fs.existsSync(compiledTemplateDir)) fs.mkdirSync(compiledTemplateDir);

    const compiledTemplateNodeModules = join(compiledTemplateDir, 'node_modules');

    const compiledTemplateNodeModulesVersion = join(compiledTemplateNodeModules, 'version.txt')

    const asarExtractedDirectory = join(tmpdir(), 'opsubcompiledcustom');

    const extractor = isDevelopmentEnv() ?
        join(__dirname, '..', '..', 'electron', 'main', 'asarextractor.js') :
        join(process.resourcesPath, 'src', 'asarextractor.js')

    const asarExtractedNodeModules = join(asarExtractedDirectory, 'dist', 'bundled-node-modules', 'modules')

    const settingsFile = isDevelopmentEnv() ?
        join(__dirname, '..', '..', 'templates', 'settings.json') :
        join(process.resourcesPath, 'templates', 'settings.json')

    const developmentNodeModules = join(app.getAppPath(), 'extra', 'bundled-node-modules', 'modules')

    return {
        // constants:
        templatesDirectory,                     //path we we store templates
        templateControllerPath,                 //path to templateController.ts
        temporaryCompiledTemplatesDirectory,    //place were we put templates when scanning them and extracting names, description and other info
        temporaryCompiledTemplatesNodeModules,  //put fake node modules there to let templates scan quickly
        templateControllerContent,              //contents of the template controller
        compiledTemplateDir,                    //where we store "real" compiled templates
        compiledTemplateNodeModules,            //where we store node_modules for "real" compiled templates
        compiledTemplateNodeModulesVersion,     //path to version.txt file which indicates updates in node_modules
        asarExtractedDirectory,                 //where to extract app.asar archive in production mode
        asarExtractedNodeModules,               //path to extracted node_modules from app.asar archive
        extractor,                              //module which extracts data from app.asar
        settingsFile,                           //app settings storage file path
        developmentNodeModules,                 //location of extracted/node_modules for development mode

        // methods:
        isDevelopmentEnv,
        puppeteerExecutablePath                 //defines puppeteer Chromium browser path
    }
}