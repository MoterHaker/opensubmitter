/// <reference path="../src/interface.d.ts" />
import Template from "./emptytemplate";
//cut


interface ChildProcess extends NodeJS.Process {
    parentPort: object
}

class ChildTemplate extends Template {
    construct() {
        if (process && typeof process.parentPort !== "undefined") {
            (process as ChildProcess).parentPort.once('message', (e) => {
                console.log("Got child message");
                (process as ChildProcess).parentPort.postMessage('hello from child');
            })
        }
    }
}

let child = new ChildTemplate();



