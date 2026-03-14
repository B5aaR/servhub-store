import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchApps, searchApps, getInstalledApps } from './services/api';
import AppGrid from './components/AppGrid';
import SearchBar from './components/SearchBar';

const NAV = [
    { label: 'Discover', items: [
        { id: 'featured',    label: 'Featured',      section: 'featured',   icon: HomeIcon },
        { id: 'new',         label: 'New & Updated', section: 'new',        icon: SparkleIcon },
        { id: 'popular',     label: 'Popular',       section: 'popular',    icon: TrendIcon },
    ]},
{ label: 'Library', items: [
    { id: 'library',     label: 'Installed Apps', isLibrary: true,      icon: LibraryIcon },
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

const ALL_ITEMS = NAV.flatMap(s => s.items);

export default function App() {
    const [apps, setApps]                   = useState([]);
    const [loading, setLoading]             = useState(true);
    const [query, setQuery]                 = useState('');
    const [activeId, setActiveId]           = useState('all');
    const [total, setTotal]                 = useState(0);
    const [installedCount, setInstalledCount] = useState(0);
    const debounce = useRef(null);
    const activeItem = ALL_ITEMS.find(i => i.id === activeId) || ALL_ITEMS[2];
    const isLibrary = !!activeItem.isLibrary;

    const loadNav = useCallback(async (item) => {
        setLoading(true);
        setApps([]);
        try {
            if (item.isLibrary) {
                const list = await getInstalledApps();
                const marked = list.map(a => ({ ...a, installed: true }));
                setApps(marked);
                setTotal(marked.length);
                setInstalledCount(marked.length);
                return;
            }
            const data = await fetchApps({ category: item.category ?? '', section: item.section ?? '' });
            const list = Array.isArray(data) ? data : (data.hits || []);
            setApps(list);
            setTotal(data.estimatedTotalHits ?? list.length);
        } catch (e) {
            console.error(e);
            setApps([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNav(activeItem);
        getInstalledApps().then(l => setInstalledCount(l.length)).catch(() => {});
    }, []);

    const handleNav = (item) => {
        if (item.id === activeId && !query) return;
        setQuery('');
        setActiveId(item.id);
        loadNav(item);
    };

    const handleSearch = (val) => {
        setQuery(val);
        clearTimeout(debounce.current);
        if (!val.trim()) { loadNav(activeItem); return; }
        if (isLibrary) return;
        debounce.current = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchApps(val, { category: activeItem.category ?? '' });
                const list = Array.isArray(data) ? data : (data.hits || []);
                setApps(list);
                setTotal(data.estimatedTotalHits ?? list.length);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }, 300);
    };

    const displayed = isLibrary && query.trim()
    ? apps.filter(a => (a.name || '').toLowerCase().includes(query.toLowerCase()) || (a.app_id || '').toLowerCase().includes(query.toLowerCase()))
    : apps;

    const subtitle = isLibrary
    ? `${displayed.length} installed app${displayed.length !== 1 ? 's' : ''}`
    : query ? `${displayed.length} result${displayed.length !== 1 ? 's' : ''} for "${query}"`
    : loading ? 'Loading…'
    : `${total.toLocaleString()} apps`;

    return (
        <div className="layout">
        <aside className="sidebar">
        <div className="sidebar-logo">
        <div className="logo-mark">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
        </div>
        <div className="logo-text">Serv<span>Hub</span></div>
        </div>

        {NAV.map(section => (
            <React.Fragment key={section.label}>
            <div className="sidebar-label">{section.label}</div>
            {section.items.map(item => (
                <button key={item.id} className={`nav-btn${activeId === item.id ? ' active' : ''}`} onClick={() => handleNav(item)}>
                <span className="nav-icon"><item.icon /></span>
                {item.label}
                {item.isLibrary && installedCount > 0 && <span className="nav-badge">{installedCount}</span>}
                </button>
            ))}
            <div className="sidebar-hr" />
            </React.Fragment>
        ))}

        <div className="sidebar-footer">
        Powered by Flathub<br />
        <span style={{ color: '#2a2a48' }}>ServHub v1.0</span>
        </div>
        </aside>

        <div className="main">
        <header className="topbar">
        <div className="topbar-left">
        <div className="topbar-title">{activeItem.label}</div>
        <div className="topbar-sub">{subtitle}</div>
        </div>
        <SearchBar
        onSearch={handleSearch}
        placeholder={isLibrary ? 'Filter installed apps…' : 'Search apps, utilities, games…'}
        resultCount={query ? displayed.length : undefined}
        />
        </header>

        {isLibrary && !loading && (
            <div className="lib-banner">
            <div className="lib-banner-icon"><LibraryIcon size={20} color="#00e5c0" /></div>
            <div>
            <h3>Your Installed Apps</h3>
            <p>All Flatpak apps installed on your system.</p>
            </div>
            </div>
        )}

        <main className="content">
        <AppGrid
        apps={displayed}
        isLoading={loading}
        isLibrary={isLibrary}
        onUninstall={(id) => {
            setApps(prev => prev.filter(a => (a.app_id || a.id) !== id));
            setInstalledCount(prev => Math.max(0, prev - 1));
        }}
        />
        </main>
        </div>
        </div>
    );
}

function HomeIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function SparkleIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function TrendIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; }
function GridIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function CodeIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>; }
function GameIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="11" r="1"/><circle cx="17" cy="13" r="1"/><path d="M21 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/></svg>; }
function ToolIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>; }
function DocIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function ArtIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>; }
function SciIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>; }
function EduIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>; }
function NetIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function MediaIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>; }
function SysIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function LibraryIcon({ size = 15, color = 'currentColor' }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
