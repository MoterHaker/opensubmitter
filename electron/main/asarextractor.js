const fs = require("fs");

if (!process || typeof process.parentPort === "undefined") {
    return;
}

process.parentPort.on('message', async(e) => {
    const message = e.data;
    if (typeof message.type === "undefined") return;
    let fullModulesPath, targetModulesPath;

    //messages from parent (main) process
    switch (message.type) {
        case 'prepare-development':
            const sourceModulesPath = message.sourceModulesPath;
            targetModulesPath = message.targetModulesPath;
            if (fs.existsSync(targetModulesPath)) {
                console.log('removing fake dir', targetModulesPath);
                fs.rmdirSync(targetModulesPath, {recursive: true});
            }
            console.log('copying', sourceModulesPath, 'to', targetModulesPath);
            fs.cpSync(sourceModulesPath, targetModulesPath, {recursive: true});
            process.exit()
            break;

        case 'prepare-production':
            const asar = require('@electron/asar');
            const asarExtractedDirectory = message.asarExtractedDirectory;
            const appPath = message.appPath;
            console.log('extracting app.asar to ', asarExtractedDirectory);
            asar.extractAll(appPath, asarExtractedDirectory);
            process.exit()
            break;
    }
})

