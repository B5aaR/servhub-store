const express = require('express');
const cors    = require('cors');
const axios   = require('axios');

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ─── Flathub category name mapping ───────────────────────────────────────────
// Our UI names  →  Flathub's main_categories filter value
const CATEGORY_MAP = {
    games:       'Game',
    development: 'Development',
    utilities:   'Utility',
    office:      'Office',
    graphics:    'Graphics',
    science:     'Science',
    network:     'Network',
    education:   'Education',
    system:      'System',
    audiovideo:  'AudioVideo',
};

// ─── Helper: call Flathub v2 search ──────────────────────────────────────────
async function flathubSearch({ query = '', category = '', limit = 250, offset = 0 } = {}) {
    const body = {
        query,
        filters: [],
        limit,
        offset,
    };

    if (category) {
        const flathubCat = CATEGORY_MAP[category.toLowerCase()] || category;
        body.filters.push({ property: 'main_categories', value: flathubCat });
    }

    const response = await axios.post('https://flathub.org/api/v2/search', body, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ message: 'ServHub API is live.', endpoints: ['/api/apps', '/api/search', '/api/install', '/api/uninstall'] });
});

// ─── GET /api/apps  ──────────────────────────────────────────────────────────
// Query params:
//   ?category=Games|Development|Utilities|Office|Graphics|Science  (optional)
//   ?section=featured|popular|new                                   (optional)
//   ?limit=250   ?offset=0
app.get('/api/apps', async (req, res) => {
    const category = req.query.category || '';
    const section  = (req.query.section || '').toLowerCase();
    const limit    = Math.min(parseInt(req.query.limit)  || 250, 500);
    const offset   = parseInt(req.query.offset) || 0;

    try {
        // Special sections use Flathub collection endpoints when available
        if (section === 'new') {
            try {
                const r = await axios.get('https://flathub.org/api/v2/collection/recently-added', { timeout: 10000 });
                return res.json(r.data);
            } catch {
                // fall through to search fallback
            }
        }

        if (section === 'popular') {
            try {
                const r = await axios.get('https://flathub.org/api/v2/collection/popular', { timeout: 10000 });
                return res.json(r.data);
            } catch {
                // fall through to search fallback
            }
        }

        // Default: search with optional category filter
        const data = await flathubSearch({ category, limit, offset });
        res.json(data);

    } catch (error) {
        console.error('[ServHub] /api/apps error:', error.message);
        res.status(500).json({ error: 'Failed to fetch apps from Flathub', detail: error.message });
    }
});

// ─── GET /api/search?q=term ───────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
    const q        = (req.query.q || '').trim();
    const category = req.query.category || '';
    const limit    = Math.min(parseInt(req.query.limit) || 250, 500);
    const offset   = parseInt(req.query.offset) || 0;

    if (!q && !category) {
        return res.status(400).json({ error: 'Provide at least ?q= or ?category=' });
    }

    try {
        const data = await flathubSearch({ query: q, category, limit, offset });
        res.json(data);
    } catch (error) {
        console.error('[ServHub] /api/search error:', error.message);
        res.status(500).json({ error: 'Search failed', detail: error.message });
    }
});

// ─── POST /api/install  ───────────────────────────────────────────────────────
// Note: in Electron the install is handled directly via IPC (main.js).
// This endpoint exists as a fallback / for non-Electron environments.
app.post('/api/install', async (req, res) => {
    const { appId } = req.body;
    if (!appId) return res.status(400).json({ error: 'appId is required' });

    const { exec } = require('child_process');
    const safe = appId.replace(/[^a-zA-Z0-9.\-_]/g, '');

    exec(`flatpak install --user -y flathub ${safe}`, { timeout: 120000 }, (error, _stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, message: stderr?.trim() || error.message });
        }
        res.json({ success: true, message: `${appId} installed successfully` });
    });
});

// ─── POST /api/uninstall ──────────────────────────────────────────────────────
app.post('/api/uninstall', async (req, res) => {
    const { appId } = req.body;
    if (!appId) return res.status(400).json({ error: 'appId is required' });

    const { exec } = require('child_process');
    const safe = appId.replace(/[^a-zA-Z0-9.\-_]/g, '');

    exec(`flatpak uninstall --user -y ${safe}`, { timeout: 60000 }, (error, _stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, message: stderr?.trim() || error.message });
        }
        res.json({ success: true, message: `${appId} uninstalled successfully` });
    });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ ServHub API is live on http://localhost:${PORT}`);
});
