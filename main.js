const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200, height: 800,
        title: 'ServHub — Linux App Store',
        autoHideMenuBar: true,
        backgroundColor: '#08080f',
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

ipcMain.on('install-app', (e, appId) => {
    const safe = sanitize(appId);
    if (!safe) return e.reply('install-reply', { success: false, message: `Invalid ID: "${appId}"` });
    exec(`flatpak install --user -y flathub ${safe}`, { timeout: 120000 }, (err, _o, se) => {
        refocus();
        e.reply('install-reply', err
        ? { success: false, message: se?.trim() || err.message }
        : { success: true });
    });
});

ipcMain.on('uninstall-app', (e, appId) => {
    const safe = sanitize(appId);
    if (!safe) return e.reply('uninstall-reply', { success: false, message: `Invalid ID: "${appId}"` });
    exec(`flatpak uninstall --user -y ${safe}`, { timeout: 60000 }, (err, _o, se) => {
        refocus();
        e.reply('uninstall-reply', err
        ? { success: false, message: se?.trim() || err.message }
        : { success: true });
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
