const BASE = 'https://api.servexa.net/api';

export const fetchApps = async ({ category = '', section = '', hitsPerPage = 250, page = 1 } = {}) => {
    const p = new URLSearchParams({ hitsPerPage, page });
    if (category) p.set('category', category);
    if (section) p.set('section', section);
    const res = await fetch(`${BASE}/apps?${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

export const searchApps = async (query, { category = '', hitsPerPage = 100 } = {}) => {
    const p = new URLSearchParams({ q: query, hitsPerPage });
    if (category) p.set('category', category);
    const res = await fetch(`${BASE}/search?${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

function ipcCall(sendCh, replyCh, payload) {
    return new Promise((resolve, reject) => {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send(sendCh, payload);
        ipcRenderer.once(replyCh, (_e, result) => {
            result.success ? resolve(result) : reject(new Error(result.message || `${sendCh} failed`));
        });
    });
}

export const requestInstall = (appId) => ipcCall('install-app', 'install-reply', appId);
export const requestUninstall = (appId) => ipcCall('uninstall-app', 'uninstall-reply', appId);

export const checkInstalledBatch = (appIds) => new Promise(resolve => {
    if (!appIds?.length) return resolve(new Set());
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('check-installed-batch', appIds);
    ipcRenderer.once('check-installed-batch-reply', (_e, r) => resolve(new Set(r.installed || [])));
});

export const getInstalledApps = () => new Promise((resolve, reject) => {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('get-installed-apps');
    ipcRenderer.once('get-installed-apps-reply', (_e, r) => {
        r.apps ? resolve(r.apps) : reject(new Error('Could not read installed apps'));
    });
});
