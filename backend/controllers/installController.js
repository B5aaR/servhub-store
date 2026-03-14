const { spawn } = require('child_process');

function sanitize(id) {
    if (!id || typeof id !== 'string') return null;
    const s = id.replace(/[^a-zA-Z0-9.\-_]/g, '');
    return s.split('.').filter(Boolean).length >= 3 ? s : null;
}

function runFlatpak(args, res) {
    const proc = spawn('flatpak', args, { timeout: 120000 });
    let stderr = '';

    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', code => {
        if (code === 0) res.json({ success: true });
        else res.status(500).json({ success: false, message: stderr.trim() || `exited with code ${code}` });
    });

    proc.on('error', err => {
        res.status(500).json({ success: false, message: err.message });
    });
}

exports.installApp = (req, res) => {
    const safe = sanitize(req.body.appId);
    if (!safe) return res.status(400).json({ error: 'Invalid or missing appId' });
    runFlatpak(['install', '--user', '-y', 'flathub', safe], res);
};

exports.uninstallApp = (req, res) => {
    const safe = sanitize(req.body.appId);
    if (!safe) return res.status(400).json({ error: 'Invalid or missing appId' });
    runFlatpak(['uninstall', '--user', '-y', safe], res);
};
