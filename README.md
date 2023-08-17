Open Submitter
====

OpenSubmitter is an app which provides end-users to run custom web automation scripts (templates) in multi-threaded NodeJS environment. 
It is written in Typescript, built on Electron + Vue 3 + Vite bundle.
Templates (written in Typescript too) may utilize the following capabilities:

- Headless (or window-less) Chromium navigation and manipulation with Puppeteer.
- Axios network library.
- Captcha solving with Anti-Captcha + template authors revenue sharing.
- Provide various custom settings to a user in UI: select a files to read/write, text inputs, checkboxes, radio buttons, etc.
- Output log entries in UI.
- Generate table with job results in UI.
- Interact with IMAP servers.
- Use other built-in NodeJS libraries.

### Documentation:
[Templates Documentation](https://opensubmitter.com/documentation/introduction)


### Cloning & running the project

```
git clone --recursive https://github.com/MoterHaker/opensubmitter.git
cd opensubmitter
npm install
npm run dev
```

For Windows users: git longpaths must be enabled to deal with "File name too long" errors:

```
git config --system core.longpaths true
```