const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200, height: 800,
        title: 'ServHub — Linux App Store',
        autoHideMenuBar: true,
        backgroundColor: '#08080f',
        icon: path.join(__dirname, 'icon.png'),
                            webPreferences: { nodeIntegration: true, contextIsolation: false },
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
        https.get(url, { headers: { 'User-Agent': 'ServHub/1.0', 'Accept': 'application/json' } }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

function httpsPost(url, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const options = {
            method: 'POST',
            headers: {
                'User-Agent': 'ServHub/1.0',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };
        const req = https.request(url, options, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        });
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

const COLLECTION_SLUG = {
    Game: 'game', Development: 'development', Utility: 'utility',
    Office: 'office', Graphics: 'graphics', Science: 'science',
    Education: 'education', Network: 'network', AudioVideo: 'audiovideo',
    System: 'system',
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

async function flathubSearch({ query = '', catValue = null, hitsPerPage = 250, page = 1 } = {}) {
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

async function getApps({ category = '', section = '', hitsPerPage = 250, page = 1 } = {}) {
    const catValue = category ? (CATEGORY_MAP[category.toLowerCase()] ?? category) : null;

    if (section === 'new') return httpsGet(`${FLATHUB}/collection/recently-added`).then(normalize).catch(() => flathubSearch({ hitsPerPage, page }));
    if (section === 'popular') return httpsGet(`${FLATHUB}/collection/popular`).then(normalize).catch(() => flathubSearch({ hitsPerPage, page }));
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

ipcMain.handle('fetch-apps', async (_e, params) => {
    const key = `apps:${JSON.stringify(params)}`;
    return cached(key, () => getApps(params));
});

ipcMain.handle('search-apps', async (_e, { query, category, hitsPerPage }) => {
    const catValue = category ? (CATEGORY_MAP[category.toLowerCase()] ?? category) : null;
    return flathubSearch({ query, catValue, hitsPerPage });
});

ipcMain.on('install-app', (e, appId) => {
    const safe = sanitize(appId);
    if (!safe) return e.reply('install-reply', { success: false, message: `Invalid ID: "${appId}"` });
    exec(`flatpak install --user -y flathub ${safe}`, { timeout: 120000 }, (err, _o, se) => {
        refocus();
        e.reply('install-reply', err ? { success: false, message: se?.trim() || err.message } : { success: true });
    });
});

ipcMain.on('uninstall-app', (e, appId) => {
    const safe = sanitize(appId);
    if (!safe) return e.reply('uninstall-reply', { success: false, message: `Invalid ID: "${appId}"` });
    exec(`flatpak uninstall --user -y ${safe}`, { timeout: 60000 }, (err, _o, se) => {
        refocus();
        e.reply('uninstall-reply', err ? { success: false, message: se?.trim() || err.message } : { success: true });
    });
});

ipcMain.on('check-installed-batch', (e, appIds) => {
    exec('flatpak list --user --app --columns=application', (_err, stdout) => {
        const ids = (stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
        e.reply('check-installed-batch-reply', { installed: ids.filter(id => appIds.includes(id)) });
    });
});

ipcMain.on('get-installed-apps', (e) => {
    exec('flatpak list --user --app --columns=application,name,version,branch,origin', (_err, stdout) => {
        if (!stdout?.trim()) return e.reply('get-installed-apps-reply', { apps: [] });
        const apps = stdout.trim().split('\n').filter(Boolean).map(line => {
            const [app_id, name, version, branch, origin] = line.split('\t').map(s => s?.trim() || '');
            return {
                app_id, name: name || app_id, version, branch: branch || 'stable',
                origin: origin || 'flathub',
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
