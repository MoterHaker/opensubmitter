/// <reference path="../src/interface.d.ts" />
import Template from "./emptytemplate";
//cut

interface ParentPort {
    postMessage: Function
}
interface ChildProcess extends NodeJS.Process {
    parentPort: ParentPort
}

class TemplateController extends Template {
    startMessaging() {
        if (!process || typeof process.parentPort === "undefined") {
            return;
        }
        (process as ChildProcess).parentPort.on('message', (e) => {
            console.log("Got child message", e.data);
            (process as ChildProcess).parentPort.postMessage({
                'msg': 'hello from child'
            });
        })
    }
}

let child = new TemplateController();

child.startMessaging();

module.exports = { TemplateController }



