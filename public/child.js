const fs = require("fs");

if (process && typeof process.parentPort !== "undefined") {
    process.parentPort.once('message', (e) => {
        console.log("Got child message");
        process.parentPort.postMessage('hello from child');
    })
}