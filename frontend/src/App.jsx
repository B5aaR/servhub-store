import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchApps, searchApps, getInstalledApps, checkUpdates, startUpdate, startInstall, startUninstall, onInstallLog, onInstallDone, onUninstallDone, removeListeners } from './services/api';
import AppGrid from './components/AppGrid';
import SearchBar from './components/SearchBar';
import InstallDrawer from './components/InstallDrawer';
import AppDetail from './components/AppDetail';
import logo from '../public/icon.png';

const NAV = [
    { label: 'Discover', items: [
        { id: 'featured',    label: 'Featured',      section: 'featured',   icon: HomeIcon },
        { id: 'new',         label: 'New & Updated', section: 'new',        icon: SparkleIcon },
        { id: 'popular',     label: 'Popular',       section: 'popular',    icon: TrendIcon },
    ]},
{ label: 'Library', items: [
    { id: 'library',     label: 'Installed Apps', isLibrary: true,      icon: LibraryIcon },
    { id: 'updates',     label: 'Updates',        isUpdates: true,      icon: UpdateIcon },
]},
{ label: 'Categories', items: [
    { id: 'all',         label: 'All Apps',      category: '',           icon: GridIcon },
    { id: 'games',       label: 'Games',         category: 'games',      icon: GameIcon },
    { id: 'development', label: 'Development',   category: 'development',icon: CodeIcon },
    { id: 'utilities',   label: 'Utilities',     category: 'utilities',  icon: ToolIcon },
    { id: 'graphics',    label: 'Graphics',      category: 'graphics',   icon: ArtIcon },
    { id: 'office',      label: 'Office',        category: 'office',     icon: DocIcon },
    { id: 'audiovideo',  label: 'Audio & Video', category: 'audiovideo', icon: MediaIcon },
    { id: 'network',     label: 'Internet',      category: 'network',    icon: NetIcon },
    { id: 'education',   label: 'Education',     category: 'education',  icon: EduIcon },
    { id: 'science',     label: 'Science',       category: 'science',    icon: SciIcon },
    { id: 'system',      label: 'System',        category: 'system',     icon: SysIcon },
]},
];

const ALL = NAV.flatMap(s => s.items);
const PAGE_SIZE = 50;

function ScopeDialog({ app, onConfirm, onCancel }) {
    return (
        <div className="scope-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
        <div className="scope-dialog">
        <div className="scope-icon">
        {app.icon_url || app.icon
            ? <img src={app.icon_url || app.icon} alt={app.name} width="48" height="48" style={{ borderRadius: 12 }} />
            : <div style={{ width:48, height:48, borderRadius:12, background:'linear-gradient(135deg,#1e1e38,#2a2a50)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, color:'var(--accent)' }}>{(app.name||'?').slice(0,2).toUpperCase()}</div>
        }
        </div>
        <h2 className="scope-title">Install {app.name}</h2>
        <p className="scope-sub">Choose where to install this app</p>
        <div className="scope-options">
        <button className="scope-btn" onClick={() => onConfirm('user')}>
        <div className="scope-btn-icon"><UserIcon /></div>
        <div>
        <div className="scope-btn-label">User install</div>
        <div className="scope-btn-desc">Only for you · No password needed</div>
        </div>
        </button>
        <button className="scope-btn" onClick={() => onConfirm('system')}>
        <div className="scope-btn-icon"><SystemIcon /></div>
        <div>
        <div className="scope-btn-label">System install</div>
        <div className="scope-btn-desc">All users · Requires password</div>
        </div>
        </button>
        </div>
        <button className="scope-cancel" onClick={onCancel}>Cancel</button>
        </div>
        </div>
    );
}
function ThemeSwitcher({ currentTheme, onChange }) {
    const themes = [
        { id: 'dark', label: 'Dark', color: '#141422', border: '#7c6aff' },
        { id: 'light', label: 'Light', color: '#f8f7fd', border: '#5546d0' },
        { id: 'greeny', label: 'Greeny', color: '#091410', border: '#38d872' },
        { id: 'sakura', label: 'Sakura', color: '#0a080f', border: '#ff85b3' },
        { id: 'latte', label: 'Latte', color: '#e6e2d8', border: '#b08968' },
        { id: 'ocean', label: 'Ocean', color: '#0b1a2a', border: '#4aa3ff' },
        { id: 'sunset', label: 'Sunset', color: '#2b1b1e', border: '#ff7b5c' },
        { id: 'espresso', label: 'Espresso', color: '#1a1412', border: '#e6b478' },
    ];

    return (
        <div style={{ padding: '0 20px 20px 20px', marginTop: 'auto' }}>
        <div className="sidebar-label" style={{ marginBottom: '12px' }}>Theme</div>
        <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center'
        }}>
        {themes.map(t => (
            <button
            key={t.id}
            onClick={() => onChange(t.id)}
            title={t.label}
            style={{
                width: 32,
                height: 32,
                borderRadius: '12px',
                cursor: 'pointer',
                background: t.color,
                border: currentTheme === t.id
                ? `3px solid ${t.border}`
                : '2px solid rgba(150,150,150,0.2)',
                          transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
                          boxShadow: currentTheme === t.id
                          ? `0 4px 12px ${t.border}80`
                          : '0 2px 6px rgba(0,0,0,0.1)',
                          transform: currentTheme === t.id ? 'scale(1.1)' : 'scale(1)',
                          outline: 'none',
            }}
            onMouseEnter={(e) => {
                if (currentTheme !== t.id) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = t.border;
                }
            }}
            onMouseLeave={(e) => {
                if (currentTheme !== t.id) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.border = '2px solid rgba(150,150,150,0.2)';
                }
            }}
            />
        ))}
        </div>
        </div>
    );
}
export default function App() {
    const [apps, setApps]               = useState([]);
    const [loading, setLoading]         = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [query, setQuery]             = useState('');
    const [activeId, setActiveId]       = useState('all');
    const [total, setTotal]             = useState(0);
    const [page, setPage]               = useState(1);
    const [libCount, setLibCount]       = useState(0);
    const [updates, setUpdates]         = useState([]);
    const [queue, setQueue]             = useState({});
    const [drawer, setDrawer]           = useState(false);
    const [detail, setDetail]           = useState(null);
    const [installedSet, setInstalledSet] = useState(new Set());
    const [scopePending, setScopePending]   = useState(null);
    const timer = useRef(null);
    const [theme, setTheme] = useState(localStorage.getItem('servhub-theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('servhub-theme', theme);
    }, [theme]);
    const active    = ALL.find(i => i.id === activeId) || ALL[2];
    const isLib     = !!active.isLibrary;
    const isUpdates = !!active.isUpdates;
    const qActive   = Object.values(queue).filter(e => e.status === 'installing' || e.status === 'uninstalling').length;
    const hasMore   = !isLib && !isUpdates && !query && !active.section && apps.length < total;

    useEffect(() => {
        onInstallLog(({ appId, line }) =>
        setQueue(q => q[appId] ? { ...q, [appId]: { ...q[appId], logs: [...q[appId].logs, line.trimEnd()] } } : q)
        );
        onInstallDone(({ appId, success, message }) => {
            setQueue(q => ({ ...q, [appId]: { ...q[appId], status: success ? 'done' : 'error', message } }));
            if (success) { setLibCount(c => c + 1); setInstalledSet(s => new Set([...s, appId])); }
        });
        onUninstallDone(({ appId, success }) => {
            setQueue(q => { const n = { ...q }; delete n[appId]; return n; });
            if (success) {
                setApps(p => p.filter(a => (a.app_id || a.id) !== appId));
                setLibCount(c => Math.max(0, c - 1));
                setInstalledSet(s => { const n = new Set(s); n.delete(appId); return n; });
                setUpdates(u => u.filter(a => (a.app_id || a.id) !== appId));
            }
        });
        return removeListeners;
    }, []);

    const doInstall = useCallback((appId, name, scope = 'user') => {
        setQueue(q => ({ ...q, [appId]: { appId, name, status: 'installing', logs: [] } }));
        setDrawer(true);
        startInstall(appId, name, scope);
    }, []);


    const install = useCallback((appId, name, appObj) => {
        setScopePending({ appId, name, app: appObj || { app_id: appId, name } });
    }, []);

    const uninstall = useCallback((appId, name) => {
        setQueue(q => ({ ...q, [appId]: { appId, name, status: 'uninstalling', logs: [] } }));
        setDrawer(true);
        startUninstall(appId, name);
    }, []);

    const update = useCallback((appId, name) => {
        setQueue(q => ({ ...q, [appId]: { appId, name, status: 'installing', logs: [] } }));
        setDrawer(true);
        startUpdate(appId, name);
    }, []);

    const loadPage = useCallback(async (item, pageNum) => {
        const data = await fetchApps({ category: item.category ?? '', section: item.section ?? '', hitsPerPage: PAGE_SIZE, page: pageNum });
        const list = Array.isArray(data) ? data : (data.hits || []);
        if (pageNum === 1) setApps(list); else setApps(prev => [...prev, ...list]);
        setPage(pageNum);
        setTotal(data.estimatedTotalHits ?? list.length);
        return list;
    }, []);

    const loadNav = useCallback(async (item) => {
        setLoading(true);
        setApps([]);
        setPage(1);
        try {
            if (item.isLibrary) {
                const list = await getInstalledApps();
                const marked = list.map(a => ({ ...a, installed: true }));
                setApps(marked); setTotal(marked.length); setLibCount(marked.length);
                return;
            }
            if (item.isUpdates) {
                const list = await checkUpdates();
                setUpdates(list);
                setApps(list.map(a => ({ ...a, installed: true })));
                setTotal(list.length);
                return;
            }
            await loadPage(item, 1);
        } catch { setApps([]); }
        finally { setLoading(false); }
    }, [loadPage]);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try { await loadPage(active, page + 1); }
        catch {}
        finally { setLoadingMore(false); }
    }, [loadingMore, hasMore, page, active, loadPage]);

    useEffect(() => {
        loadNav(active);
        getInstalledApps().then(l => setLibCount(l.length)).catch(() => {});
        checkUpdates().then(setUpdates).catch(() => {});
    }, []);

    const handleNav = item => {
        if (item.id === activeId && !query) return;
        setQuery(''); setActiveId(item.id); loadNav(item);
    };

    const handleSearch = val => {
        setQuery(val);
        clearTimeout(timer.current);
        if (!val.trim()) { loadNav(active); return; }
        if (isLib || isUpdates) return;
        timer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchApps(val, { category: active.category ?? '' });
                const list = Array.isArray(data) ? data : (data.hits || []);
                setApps(list); setTotal(data.estimatedTotalHits ?? list.length);
            } catch {}
            finally { setLoading(false); }
        }, 300);
    };

    const shown = (isLib || isUpdates) && query.trim()
    ? apps.filter(a => (a.name || '').toLowerCase().includes(query.toLowerCase()) || (a.app_id || '').toLowerCase().includes(query.toLowerCase()))
    : apps;

    const sub = isLib
    ? `${shown.length} installed app${shown.length !== 1 ? 's' : ''}`
    : isUpdates
    ? updates.length ? `${updates.length} update${updates.length !== 1 ? 's' : ''} available` : 'All apps up to date'
    : query ? `${shown.length} result${shown.length !== 1 ? 's' : ''} for "${query}"`
    : loading ? 'Loading…'
    : `${shown.length.toLocaleString()} of ${total.toLocaleString()} apps`;

    return (
        <div className="layout">
        <aside className="sidebar">
        <div className="sidebar-logo">
        <img src={logo} width="36" height="36" style={{ borderRadius: 10 }} alt="ServHub" />
        <div className="logo-text">Serv<span>Hub</span></div>
        </div>
        {NAV.map(s => (
            <React.Fragment key={s.label}>
            <div className="sidebar-label">{s.label}</div>
            {s.items.map(item => (
                <button key={item.id} className={`nav-btn${activeId === item.id ? ' active' : ''}`} onClick={() => handleNav(item)}>
                <span className="nav-icon"><item.icon /></span>
                {item.label}
                {item.isLibrary && libCount > 0 && <span className="nav-badge">{libCount}</span>}
                {item.isUpdates && updates.length > 0 && <span className="nav-badge" style={{ background:'rgba(255,180,0,.15)', color:'#ffb400', borderColor:'rgba(255,180,0,.25)' }}>{updates.length}</span>}
                </button>
            ))}
            <div className="sidebar-hr" />
            </React.Fragment>
        ))}
        <ThemeSwitcher currentTheme={theme} onChange={setTheme} />
        <div className="sidebar-footer">
        Powered by Flathub<br />
        <span style={{ color: '#2a2a48' }}>ServHub v1.0</span>
        </div>
        </aside>

        <div className="main">
        <header className="topbar">
        <div className="topbar-left">
        <div className="topbar-title">{active.label}</div>
        <div className="topbar-sub">{sub}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {qActive > 0 && (
            <button className="queue-btn" onClick={() => setDrawer(true)}>
            <span className="q-spinner"/>{qActive} installing
            </button>
        )}
        <SearchBar
        onSearch={handleSearch}
        placeholder={isLib ? 'Filter installed apps…' : isUpdates ? 'Filter updates…' : 'Search apps, utilities, games…'}
        resultCount={query ? shown.length : undefined}
        />
        </div>
        </header>

        {isLib && !loading && (
            <div className="lib-banner">
            <div className="lib-banner-icon"><LibraryIcon size={20} color="#00e5c0" /></div>
            <div><h3>Your Installed Apps</h3><p>All Flatpak apps installed on your system.</p></div>
            </div>
        )}

        {isUpdates && !loading && updates.length > 0 && (
            <div className="lib-banner" style={{ borderColor:'rgba(255,180,0,.2)', background:'linear-gradient(135deg,rgba(255,180,0,.07),rgba(124,106,255,.07))' }}>
            <div className="lib-banner-icon" style={{ background:'linear-gradient(135deg,rgba(255,180,0,.2),rgba(124,106,255,.2))' }}>
            <UpdateIcon size={20} color="#ffb400" />
            </div>
            <div style={{ flex:1 }}>
            <h3>{updates.length} update{updates.length !== 1 ? 's' : ''} available</h3>
            <p>Flatpak app updates ready to install.</p>
            </div>
            <button className="btn btn-install" style={{ background:'rgba(255,180,0,.15)', color:'#ffb400', border:'1px solid rgba(255,180,0,.3)' }}
            onClick={() => updates.forEach(u => update(u.app_id, u.name || u.app_id))}>
            Update All
            </button>
            </div>
        )}

        <main className="content">
        <AppGrid
        apps={shown} isLoading={loading} isLibrary={isLib || isUpdates}
        queue={queue}
        onInstall={isUpdates ? update : (appId, name, app) => install(appId, name, app)}
        onUninstall={uninstall}
        onOpen={setDetail}
        hasMore={hasMore} loadingMore={loadingMore} onLoadMore={loadMore}
        />
        </main>
        </div>

        {scopePending && (
            <ScopeDialog
            app={scopePending.app}
            onConfirm={scope => {
                doInstall(scopePending.appId, scopePending.name, scope);
                setScopePending(null);
            }}
            onCancel={() => setScopePending(null)}
            />
        )}

        {detail && (
            <AppDetail
            app={detail}
            isInstalled={installedSet.has((detail.app_id || detail.id || '').replace(/_/g, '.')) || !!detail.installed}
            queue={queue}
            onInstall={(appId, name) => install(appId, name, detail)}
            onUninstall={uninstall}
            onUpdate={update}
            onBack={() => setDetail(null)}
            />
        )}

        {drawer && Object.keys(queue).length > 0 && <InstallDrawer queue={queue} onClose={() => setDrawer(false)} />}
        </div>
    );
}

function HomeIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3L4 9v10.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V9L12 3z" fill="#3B82F6"/>
    <path d="M15 21v-7h-6v7h6z" fill="#93C5FD"/>
    </svg>;
}
function SparkleIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" fill="#F59E0B"/>
    <path d="M19 8l1.5 3.5L24 13l-3.5 1.5L19 18l-1.5-3.5L14 13l3.5-1.5L19 8z" fill="#FCD34D"/>
    </svg>;
}
function TrendIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 21a9 9 0 0 0 9-9c0-5-4-9-5-10 0 3-2 5-4 5-2 0-3-1.5-3-3-2 2.5-6 6-6 10a9 9 0 0 0 9 7z" fill="#EF4444"/>
    <path d="M12 21a5 5 0 0 0 5-5c0-3-2-5-3-6 0 2-1 3-2 3s-2-1-2-2c-1 1.5-3 3-3 5a5 5 0 0 0 5 5z" fill="#FCA5A5"/>
    </svg>;
}
function LibraryIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="16" rx="2" fill="#8B5CF6"/>
    <path d="M3 8h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" fill="#A78BFA"/>
    <rect x="8" y="10" width="8" height="3" rx="1.5" fill="#DDD6FE"/>
    </svg>;
}
function UpdateIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3z" fill="#10B981"/>
    <path d="M12 2l4 4-4 4V2z" fill="#A7F3D0"/>
    </svg>;
}
function GridIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="7" height="7" rx="2" fill="#6366F1"/>
    <rect x="13" y="4" width="7" height="7" rx="2" fill="#818CF8"/>
    <rect x="4" y="13" width="7" height="7" rx="2" fill="#818CF8"/>
    <rect x="13" y="13" width="7" height="7" rx="2" fill="#A5B4FC"/>
    </svg>;
}
function GameIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="12" rx="6" fill="#A855F7"/>
    <circle cx="16" cy="10" r="1.5" fill="#E9D5FF"/>
    <circle cx="18" cy="12" r="1.5" fill="#E9D5FF"/>
    <circle cx="14" cy="12" r="1.5" fill="#E9D5FF"/>
    <circle cx="16" cy="14" r="1.5" fill="#E9D5FF"/>
    <path d="M6 11h4v2H6v-2zM8 9v6H6V9h2z" fill="#E9D5FF"/>
    </svg>;
}
function CodeIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="14" rx="3" fill="#334155"/>
    <path d="M7 10l-2 2 2 2" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M11 14h4" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>;
}
function ToolIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="#14B8A6"/>
    <circle cx="18" cy="6" r="2.5" fill="#99F6E4"/>
    </svg>;
}
function ArtIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10c0 1.25-.8 2.25-1.78 2.25-.66 0-1.28-.27-1.73-.74-.46-.47-1.1-1.15-2.09-.9a2.38 2.38 0 0 0-1.7 1.83C14.39 21.1 13.25 22 12 22z" fill="#EC4899"/>
    <circle cx="7.5" cy="10.5" r="1.5" fill="#FBCFE8"/>
    <circle cx="10.5" cy="6.5" r="1.5" fill="#FBCFE8"/>
    <circle cx="15.5" cy="8.5" r="1.5" fill="#FBCFE8"/>
    </svg>;
}
function DocIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="3" width="14" height="18" rx="2" fill="#0EA5E9"/>
    <path d="M9 8h6M9 12h6M9 16h4" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>;
}
function MediaIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="3" fill="#F43F5E"/>
    <path d="M10 9l5 3-5 3V9z" fill="#FECDD3"/>
    </svg>;
}
function NetIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#06B6D4"/>
    <path d="M2 12h20" stroke="#CFFAFE" strokeWidth="2"/>
    <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#CFFAFE" strokeWidth="2"/>
    </svg>;
}
function EduIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3l10 6-10 6L2 9l10-6z" fill="#D946EF"/>
    <path d="M6 11.4v4.2c0 1.5 2.7 3.4 6 3.4s6-1.9 6-3.4v-4.2L12 15l-6-3.6z" fill="#F0ABFC"/>
    </svg>;
}
function SciIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M10 5l-5 14a2 2 0 0 0 1.8 2.8h10.4A2 2 0 0 0 19 19L14 5h-4z" fill="#0EA5E9"/>
    <path d="M7 14h10v5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-5z" fill="#7DD3FC"/>
    <path d="M9 2h6v3H9V2z" fill="#38BDF8"/>
    </svg>;
}
function SysIcon({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="5" width="14" height="14" rx="2" fill="#64748B"/>
    <rect x="9" y="9" width="6" height="6" rx="1" fill="#E2E8F0"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>;
}function UserIcon({ size = 18 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7" r="5" fill="#8B5CF6"/>
    <path d="M4 21c0-4.5 4-7 8-7s8 2.5 8 7" fill="#C4B5FD"/>
    </svg>;
}

function SystemIcon({ size = 18 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="12" rx="2" fill="#3B82F6"/>
    <path d="M8 20h8M12 16v4" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round"/>
    </svg>;
}
