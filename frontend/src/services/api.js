const ipc = () => window.require('electron').ipcRenderer;

export const fetchApps = (params = {}) => ipc().invoke('fetch-apps', params);

export const searchApps = (query, { category = '', hitsPerPage = 100 } = {}) =>
ipc().invoke('search-apps', { query, category, hitsPerPage });

function ipcCall(sendCh, replyCh, payload) {
    return new Promise((resolve, reject) => {
        const r = ipc();
        r.send(sendCh, payload);
        r.once(replyCh, (_e, result) => {
            result.success ? resolve(result) : reject(new Error(result.message || `${sendCh} failed`));
        });
    });
}

export const requestInstall   = (appId) => ipcCall('install-app',   'install-reply',   appId);
export const requestUninstall = (appId) => ipcCall('uninstall-app', 'uninstall-reply', appId);

export const checkInstalledBatch = (appIds) => new Promise(resolve => {
    if (!appIds?.length) return resolve(new Set());
    const r = ipc();
    r.send('check-installed-batch', appIds);
    r.once('check-installed-batch-reply', (_e, res) => resolve(new Set(res.installed || [])));
});

export const getInstalledApps = () => new Promise((resolve, reject) => {
    const r = ipc();
    r.send('get-installed-apps');
    r.once('get-installed-apps-reply', (_e, res) => {
        res.apps ? resolve(res.apps) : reject(new Error('Could not read installed apps'));
    });
});
