const s = () => window.servhub;

export const fetchApps     = (p = {})  => s().fetchApps(p);
export const searchApps    = (q, opts) => s().searchApps({ query: q, ...opts });
export const getAppDetails = (id)      => s().getAppDetails(id);
export const checkUpdates  = ()        => s().checkUpdates();
export const launchApp     = (id)      => s().launchApp(id);

export const checkInstalledBatch = (ids) => new Promise(resolve => {
    if (!ids?.length) return resolve(new Set());
    s().once('check-installed-batch-reply', r => resolve(new Set(r.installed || [])));
    s().checkInstalledBatch(ids);
});

export const getInstalledApps = () => new Promise((resolve, reject) => {
    s().once('get-installed-apps-reply', r => r.apps ? resolve(r.apps) : reject(new Error('Failed')));
    s().getInstalledApps();
});

export const startInstall   = (appId, name) => s().installApp({ appId, name });
export const startUninstall = (appId, name) => s().uninstallApp({ appId, name });
export const startUpdate    = (appId, name) => s().updateApp({ appId, name });

export const onInstallLog    = cb => s().on('install-log',    cb);
export const onInstallDone   = cb => s().on('install-done',   cb);
export const onUninstallDone = cb => s().on('uninstall-done', cb);
export const removeListeners = () => {
    s().removeAllListeners('install-log');
    s().removeAllListeners('install-done');
    s().removeAllListeners('uninstall-done');
};
