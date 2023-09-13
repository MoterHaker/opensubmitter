const fs = require("fs");
const asar = require("@electron/asar");

if (!process || typeof process.parentPort === "undefined") {
    return;
}

function rmDirRecursive(path) {
    return new Promise(resolve => {
        fs.rm(path, {recursive: true}, () => { resolve(true); })
    })
}

process.parentPort.on('message', async(e) => {
    const message = e.data;
    if (typeof message.type === "undefined") return;
    let fullModulesPath, targetModulesPath;

    //messages from parent (main) process
    switch (message.type) {

        case 'prepare-production':
            const asar = require('@electron/asar');
            const compiledTemplateDir = message.compiledTemplateDir;
            const appPath = message.appPath;
            fullModulesPath = message.fullModulesPath;
            targetModulesPath = message.targetModulesPath;

            //extracting archive first to temporary dir with all app.asar contents
            console.log('extracting app.asar to ', compiledTemplateDir);
            asar.extractAll(appPath, compiledTemplateDir);

            //checking if node_modules already exists, removing if yes
            if (fs.existsSync(targetModulesPath)) {
                console.log('removing existing node_modules dir', targetModulesPath);
                await rmDirRecursive(targetModulesPath);
            }

            //moving node_modules
            console.log('moving', fullModulesPath, 'to', targetModulesPath);
            fs.renameSync(fullModulesPath, targetModulesPath)

            process.exit(0)
            break;

        case 'prepare-development':
            const sourceModulesPath = message.sourceModulesPath;
            targetModulesPath = message.targetModulesPath;
            if (fs.existsSync(targetModulesPath)) {
                console.log('removing existing node_modules dir', targetModulesPath);
                fs.rmdirSync(targetModulesPath, {recursive: true});
            }
            console.log('copying', sourceModulesPath, 'to', targetModulesPath);
            fs.cpSync(sourceModulesPath, targetModulesPath, {recursive: true});
            process.exit(0)
            break;
    }
})

