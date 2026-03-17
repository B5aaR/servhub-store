const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('servhub', {
    fetchApps:          (p)   => ipcRenderer.invoke('fetch-apps', p),
                                searchApps:         (p)   => ipcRenderer.invoke('search-apps', p),
                                getAppDetails:      (id)  => ipcRenderer.invoke('get-app-details', id),
                                checkUpdates:       ()    => ipcRenderer.invoke('check-updates'),
                                installApp:         (p)   => ipcRenderer.send('install-app', p),
                                uninstallApp:       (p)   => ipcRenderer.send('uninstall-app', p),
                                updateApp:          (p)   => ipcRenderer.send('update-app', p),
                                launchApp:          (id)  => ipcRenderer.send('launch-app', id),
                                checkInstalledBatch:(ids) => ipcRenderer.send('check-installed-batch', ids),
                                getInstalledApps:   ()    => ipcRenderer.send('get-installed-apps'),
                                on:   (ch, cb) => ipcRenderer.on(ch,   (_, d) => cb(d)),
                                once: (ch, cb) => ipcRenderer.once(ch, (_, d) => cb(d)),
                                removeAllListeners: (ch)  => ipcRenderer.removeAllListeners(ch),
});
