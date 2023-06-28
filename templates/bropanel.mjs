
export default class Template {

    page = null;

    // constructor(page) {
    //     this.page = page;
    // }

    async run() {
        try {
            console.log('navigating...');
            await this.page.goto('http://bropanel.com/', {
                waitUntil: "networkidle0",
                timeout: 20000
            });
        } catch (e) {
            console.log('err while loading the page: ' + e);
        }
        const result = await this.page.content();
        console.log(result);
        return result;
    }

}
