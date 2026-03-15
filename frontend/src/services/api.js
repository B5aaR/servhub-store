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

function normalize(data) {
    if (!data) return { hits: [], estimatedTotalHits: 0 };
    if (Array.isArray(data)) return { hits: data, estimatedTotalHits: data.length };
    const hits = data.hits || data.apps || data.data || [];
    return { hits, estimatedTotalHits: data.estimatedTotalHits ?? data.total ?? hits.length };
}

async function flathubGet(path) {
    const res = await fetch(`${FLATHUB}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return normalize(await res.json());
}

async function flathubSearch({ query = '', catValue = null, hitsPerPage = 250, page = 1 } = {}) {
    const base = { query, hitsPerPage, limit: hitsPerPage, page, offset: (page - 1) * hitsPerPage };
    const forms = catValue ? [
        { filter:  `main_categories = "${catValue}"` },
        { filter:  [`main_categories = "${catValue}"`] },
        { filters: [`main_categories = "${catValue}"`] },
        { facetFilters: [[`main_categories:${catValue}`]] },
    ] : [{}];

    for (const f of forms) {
        try {
            const res = await fetch(`${FLATHUB}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...base, ...f }),
            });
            if (!res.ok) continue;
            const result = normalize(await res.json());
            if (result.hits.length > 0 || !catValue) return result;
        } catch {}
    }
    return { hits: [], estimatedTotalHits: 0 };
}

export const fetchApps = async ({ category = '', section = '', hitsPerPage = 250, page = 1 } = {}) => {
    if (section === 'new')      return flathubGet('/collection/recently-added').catch(() => flathubSearch({ hitsPerPage, page }));
    if (section === 'popular')  return flathubGet('/collection/popular').catch(() => flathubSearch({ hitsPerPage, page }));
    if (section === 'featured') return flathubGet('/collection/recently-updated').catch(() => flathubSearch({ hitsPerPage, page }));

    const catValue = category ? (CATEGORY_MAP[category.toLowerCase()] ?? category) : null;

    if (catValue) {
        const slug = COLLECTION_SLUG[catValue];
        if (slug) {
            try {
                const result = await flathubGet(`/collection/category/${slug}`);
                if (result.hits.length) return result;
            } catch {}
        }
        return flathubSearch({ catValue, hitsPerPage, page });
    }

    return flathubSearch({ hitsPerPage, page });
};

export const searchApps = async (query, { category = '', hitsPerPage = 100 } = {}) => {
    const catValue = category ? (CATEGORY_MAP[category.toLowerCase()] ?? category) : null;
    return flathubSearch({ query, catValue, hitsPerPage });
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

export const requestInstall   = (appId) => ipcCall('install-app',   'install-reply',   appId);
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
