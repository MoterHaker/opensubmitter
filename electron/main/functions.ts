import fs from "fs";

export const delay = (time: number) : Promise<void> => {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    });
}

export const rmDirRecursive = (path: string): Promise<boolean> => {
    return new Promise(resolve => {
        fs.rm(path, {recursive: true}, () => { resolve(true); })
    })
}


export const isDevelopmentEnv = (): boolean => {
    return process.env && process.env.NODE_ENV && process.env.NODE_ENV === "development";
}