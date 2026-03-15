const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const https = require('https');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200, height: 800,
        title: 'ServHub — Linux App Store',
        autoHideMenuBar: true,
        backgroundColor: '#08080f',
        icon: path.join(__dirname, 'icon.png'),
                            webPreferences: {
                                nodeIntegration: false,
                            contextIsolation: true,
                            preload: path.join(__dirname, 'preload.js'),
                            },
    });
    win.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
}

const refocus = () => win && !win.isDestroyed() && win.focus();

function sanitize(id) {
    if (!id || typeof id !== 'string') return null;
    const s = id.replace(/[^a-zA-Z0-9.\-_]/g, '');
    return s.split('.').filter(Boolean).length >= 3 ? s : null;
}

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'ServHub/1.0', 'Accept': 'application/json' } }, res => {
            let d = '';
            res.on('data', chunk => d += chunk);
            res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
        });
        req.setTimeout(12000, () => { req.destroy(); reject(new Error('Request timed out')); });
        req.on('error', reject);
    });
}

function httpsPost(url, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'User-Agent': 'ServHub/1.0',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
        });
        req.setTimeout(12000, () => { req.destroy(); reject(new Error('Request timed out')); });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

const FLATHUB = 'https://flathub.org/api/v2';

const CATEGORY_MAP = {
    games: 'Game', development: 'Development', utilities: 'Utility',
    office: 'Office', graphics: 'Graphics', science: 'Science',
    education: 'Education', network: 'Network', audiovideo: 'AudioVideo',
    system: 'System',
};


const cache = new Map();
const CACHE_TTL = 8 * 60 * 1000;

function cached(key, fn) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data);
    return fn().then(data => { cache.set(key, { data, ts: Date.now() }); return data; });
}

function normalize(data) {
    if (!data) return { hits: [], estimatedTotalHits: 0 };
    if (Array.isArray(data)) return { hits: data, estimatedTotalHits: data.length };
    const hits = data.hits || data.apps || data.data || [];
    return { hits, estimatedTotalHits: data.estimatedTotalHits ?? data.total ?? hits.length };
}

async function flathubSearch({ query = '', catValue = null, hitsPerPage = 50, page = 1 } = {}) {
    const base = { query, hitsPerPage, limit: hitsPerPage, page, offset: (page - 1) * hitsPerPage };
    const forms = catValue ? [
        { filter: `main_categories = "${catValue}"` },
        { filter: [`main_categories = "${catValue}"`] },
        { filters: [`main_categories = "${catValue}"`] },
        { facetFilters: [[`main_categories:${catValue}`]] },
    ] : [{}];

    for (const f of forms) {
        try {
            const result = normalize(await httpsPost(`${FLATHUB}/search`, { ...base, ...f }));
            if (result.hits.length > 0 || !catValue) return result;
        } catch {}
    }
    return { hits: [], estimatedTotalHits: 0 };
}

const COLLECTION_SLUG = {
    Game: 'game', Development: 'development', Utility: 'utility',
    Office: 'office', Graphics: 'graphics', Science: 'science',
    Education: 'education', Network: 'network', AudioVideo: 'audiovideo',
    System: 'system',
};

async function getApps({ category = '', section = '', hitsPerPage = 50, page = 1 } = {}) {
    const catValue = category ? (CATEGORY_MAP[category.toLowerCase()] ?? category) : null;

    if (section === 'new')      return httpsGet(`${FLATHUB}/collection/recently-added`).then(normalize).catch(() => flathubSearch({ hitsPerPage, page }));
    if (section === 'popular')  return httpsGet(`${FLATHUB}/collection/popular`).then(normalize).catch(() => flathubSearch({ hitsPerPage, page }));
    if (section === 'featured') return httpsGet(`${FLATHUB}/collection/recently-updated`).then(normalize).catch(() => flathubSearch({ hitsPerPage, page }));

    if (catValue) {
        const slug = COLLECTION_SLUG[catValue];
        if (slug) {
            try {
                const result = normalize(await httpsGet(`${FLATHUB}/collection/category/${slug}`));
                if (result.hits.length) return result;
            } catch {}
        }
        return flathubSearch({ catValue, hitsPerPage, page });
    }

    return flathubSearch({ hitsPerPage, page });
}

ipcMain.handle('fetch-apps', (_e, params) =>
cached(`apps:${JSON.stringify(params)}`, () => getApps(params))
);

ipcMain.handle('search-apps', (_e, { query, category, hitsPerPage }) => {
    const catValue = category ? (CATEGORY_MAP[category.toLowerCase()] ?? category) : null;
    return flathubSearch({ query, catValue, hitsPerPage });
});

ipcMain.handle('get-app-details', (_e, appId) =>
cached(`detail:${appId}`, () => httpsGet(`${FLATHUB}/appstream/${appId}`))
);

ipcMain.handle('check-updates', async () => {
    return new Promise(resolve => {
        exec('flatpak remote-ls --updates --app --columns=application,version', { maxBuffer: 10 * 1024 * 1024 }, (_err, stdout) => {
            if (!stdout?.trim()) return resolve([]);
            const updates = stdout.trim().split('\n').filter(Boolean).map(line => {
                const [app_id, version] = line.split('\t').map(s => s?.trim() || '');
                return { app_id, version };
            });
            resolve(updates);
        });
    });
});

ipcMain.on('update-app', (e, { appId, name }) => {
    const safe = sanitize(appId);
    if (!safe) return e.sender.send('install-done', { appId, success: false, message: `Invalid ID` });
    spawnFlatpak(e, ['update', '--user', '-y', safe], appId, name, 'install-done');
});

ipcMain.on('launch-app', (e, appId) => {
    const safe = sanitize(appId);
    if (!safe) return;
    exec(`flatpak run ${safe}`, { timeout: 10000 }, (err) => {
        if (err) e.sender.send('launch-error', { appId, message: err.message });
    });
});

function spawnFlatpak(e, args, appId, name, doneEvent) {
    const proc = spawn('flatpak', args);
    proc.stdout.on('data', d => e.sender.send('install-log', { appId, line: d.toString() }));
    proc.stderr.on('data', d => e.sender.send('install-log', { appId, line: d.toString() }));
    proc.on('close', code => {
        refocus();
        e.sender.send(doneEvent, { appId, name, success: code === 0, message: code !== 0 ? `Exited with code ${code}` : null });
    });
    proc.on('error', err => e.sender.send(doneEvent, { appId, name, success: false, message: err.message }));
}

ipcMain.on('install-app', (e, { appId, name }) => {
    const safe = sanitize(appId);
    if (!safe) return e.sender.send('install-done', { appId, success: false, message: `Invalid ID: "${appId}"` });
    spawnFlatpak(e, ['install', '--user', '-y', 'flathub', safe], appId, name, 'install-done');
});

ipcMain.on('uninstall-app', (e, { appId, name }) => {
    const safe = sanitize(appId);
    if (!safe) return e.sender.send('uninstall-done', { appId, success: false, message: `Invalid ID: "${appId}"` });
    spawnFlatpak(e, ['uninstall', '--user', '-y', safe], appId, name, 'uninstall-done');
});

ipcMain.on('check-installed-batch', (e, appIds) => {
    exec('flatpak list --app --columns=application', { maxBuffer: 10 * 1024 * 1024 }, (_err, stdout) => {
        const ids = (stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
        e.reply('check-installed-batch-reply', { installed: ids.filter(id => appIds.includes(id)) });
    });
});

ipcMain.on('get-installed-apps', (e) => {
    exec('flatpak list --app --columns=application,name,version,branch,origin', { maxBuffer: 10 * 1024 * 1024 }, (_err, stdout) => {
        if (!stdout?.trim()) return e.reply('get-installed-apps-reply', { apps: [] });
        const apps = stdout.trim().split('\n').filter(Boolean).map(line => {
            const [app_id, name, version, branch, origin] = line.split('\t').map(s => s?.trim() || '');
            return {
                app_id, name: name || app_id, version,
                branch: branch || 'stable', origin: origin || 'flathub',
                icon_url: `https://dl.flathub.org/media/${app_id.replace(/\./g, '/')}/128x128/icon.png`,
                                                                   summary: `${origin || 'flathub'} · ${version ? 'v' + version : 'installed'}`,
                                                                   installed: true,
            };
        });
        e.reply('get-installed-apps-reply', { apps });
    });
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
