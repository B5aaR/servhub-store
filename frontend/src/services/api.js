const ipc = () => window.require('electron').ipcRenderer;

export const fetchApps  = (p = {}) => ipc().invoke('fetch-apps', p);
export const searchApps = (query, { category = '', n = 100 } = {}) => ipc().invoke('search-apps', { query, category, n });

export const checkInstalledBatch = ids => new Promise(resolve => {
    if (!ids?.length) return resolve(new Set());
    const r = ipc();
    r.send('check-installed-batch', ids);
    r.once('check-installed-batch-reply', (_e, res) => resolve(new Set(res.installed || [])));
});

export const getInstalledApps = () => new Promise((resolve, reject) => {
    const r = ipc();
    r.send('get-installed-apps');
    r.once('get-installed-apps-reply', (_e, res) => res.apps ? resolve(res.apps) : reject(new Error('Failed')));
});

export const startInstall   = (appId, name) => ipc().send('install-app',   { appId, name });
export const startUninstall = (appId, name) => ipc().send('uninstall-app', { appId, name });

export const onInstallLog      = cb => ipc().on('install-log',    (_e, d) => cb(d));
export const onInstallDone     = cb => ipc().on('install-done',   (_e, d) => cb(d));
export const onUninstallDone   = cb => ipc().on('uninstall-done', (_e, d) => cb(d));
export const removeListeners   = () => {
    const r = ipc();
    r.removeAllListeners('install-log');
    r.removeAllListeners('install-done');
    r.removeAllListeners('uninstall-done');
};
