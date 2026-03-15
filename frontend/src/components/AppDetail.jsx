import React, { useState, useEffect } from 'react';
import { getAppDetails, launchApp } from '../services/api';

function popularityStars(n) {
    if (!n) return 0;
    if (n > 100000) return 5;
    if (n > 30000)  return 4;
    if (n > 10000)  return 3;
    if (n > 2000)   return 2;
    return 1;
}

function Stars({ count, installs }) {
    if (!count) return null;
    return (
        <div className="detail-stars">
        <div className="detail-stars-row">
        {[1,2,3,4,5].map(i => (
            <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= count ? '#ffb400' : 'rgba(255,255,255,0.12)'} stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
        ))}
        </div>
        {installs && <div className="detail-stars-label">{installs.toLocaleString()} downloads/mo</div>}
        </div>
    );
}

function stripHtml(str) {
    if (!str) return '';
    return str.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function RichText({ html, className }) {
    if (!html) return null;
    const isHtml = /<[a-z][\s\S]*>/i.test(html);
    if (isHtml) return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
    return <p className={className}>{html}</p>;
}

export default function AppDetail({ app, isInstalled, queue = {}, onInstall, onUninstall, onBack }) {
    const [detail, setDetail]     = useState(null);
    const [loading, setLoading]   = useState(true);
    const [imgErr, setImgErr]     = useState(false);
    const [shot, setShot]         = useState(0);
    const [lightbox, setLightbox] = useState(false);
    const [launchErr, setLaunchErr] = useState(false);

    const appId = (app.app_id || app.id || '').replace(/_/g, '.');
    const name  = app.name || app.title || 'Unknown';
    const q     = queue[appId];
    const isActive = q?.status === 'installing' || q?.status === 'uninstalling';
    const isDone   = isInstalled || q?.status === 'done';
    const installs = app.installs_last_month || detail?.installs_last_month;

    useEffect(() => {
        const ipc = () => window.servhub;
        ipc().on('launch-error', ({ appId: id }) => {
            if (id === appId) { setLaunchErr(true); setTimeout(() => setLaunchErr(false), 3000); }
        });
        return () => ipc().removeAllListeners('launch-error');
    }, [appId]);

    useEffect(() => {
        setLoading(true);
        getAppDetails(appId)
        .then(d => setDetail(d))
        .catch(() => setDetail(null))
        .finally(() => setLoading(false));
    }, [appId]);

    const screenshots = (detail?.screenshots || [])
    .map(s => {
        if (s?.sizes?.length) {
            const sorted = [...s.sizes].sort((a, b) => (b.width || 0) - (a.width || 0));
            return sorted[0]?.src || null;
        }
        return s?.src || null;
    })
    .filter(Boolean);

    const links = detail?.urls || {};
    const stars = popularityStars(installs);

    const prevShot = (e) => { e.stopPropagation(); setShot(s => (s - 1 + screenshots.length) % screenshots.length); };
    const nextShot = (e) => { e.stopPropagation(); setShot(s => (s + 1) % screenshots.length); };

    return (
        <>
        <div className="detail-overlay" onClick={e => e.target === e.currentTarget && onBack()}>
        <div className="detail-panel">

        <button className="detail-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
        </button>

        <div className="detail-hero">
        {!imgErr && (app.icon_url || app.icon)
            ? <img className="detail-icon" src={app.icon_url || app.icon} alt={name} onError={() => setImgErr(true)} />
            : <div className="detail-icon-fb">{name.slice(0, 2).toUpperCase()}</div>
        }
        <div className="detail-hero-info">
        <h1 className="detail-name">{name}</h1>
        {detail?.developer_name && <div className="detail-dev">{detail.developer_name}</div>}
        {(app.categories?.[0] || app.category) && (
            <span className="card-cat" style={{ marginTop: 6 }}>{app.categories?.[0] || app.category}</span>
        )}
        <Stars count={stars} installs={installs} />
        <div className="detail-actions">
        {isActive ? (
            <button className="btn btn-working" disabled>
            <span className="spinner"/>{q.status === 'uninstalling' ? 'Removing…' : 'Installing…'}
            </button>
        ) : isDone ? (
            <>
            <button className="btn btn-launch" onClick={() => launchApp(appId)}>
            <LaunchIcon/>{launchErr ? 'Failed to launch' : 'Launch'}
            </button>
            <button className="btn btn-remove" onClick={() => onUninstall?.(appId, name)}>
            <TrashIcon/>Uninstall
            </button>
            </>
        ) : (
            <button className="btn btn-install" onClick={() => onInstall?.(appId, name)}>
            <DlIcon/>Install
            </button>
        )}
        {links.homepage && (
            <a className="btn btn-link" href={links.homepage} target="_blank" rel="noreferrer">
            <LinkIcon/>Website
            </a>
        )}
        </div>
        </div>
        <div className="detail-stats">
        {app.download_size && (
            <div className="detail-stat">
            <div className="detail-stat-val">{(app.download_size/1024/1024).toFixed(0)} MB</div>
            <div className="detail-stat-label">Size</div>
            </div>
        )}
        {detail?.releases?.[0]?.version && (
            <div className="detail-stat">
            <div className="detail-stat-val">{detail.releases[0].version}</div>
            <div className="detail-stat-label">Version</div>
            </div>
        )}
        {installs && (
            <div className="detail-stat">
            <div className="detail-stat-val">{installs.toLocaleString()}</div>
            <div className="detail-stat-label">Downloads/mo</div>
            </div>
        )}
        </div>
        </div>

        {screenshots.length > 0 && (
            <div className="detail-shots">
            <div className="detail-shot-main" onClick={() => setLightbox(true)}>
            <img src={screenshots[shot]} alt="screenshot" />
            <div className="detail-shot-zoom"><ZoomIcon /></div>
            </div>
            {screenshots.length > 1 && (
                <div className="detail-shot-thumbs">
                {screenshots.slice(0, 6).map((src, i) => (
                    <button key={i} className={`detail-shot-thumb${shot === i ? ' active' : ''}`} onClick={() => setShot(i)}>
                    <img src={src} alt="" />
                    </button>
                ))}
                </div>
            )}
            </div>
        )}

        <div className="detail-body">
        {loading ? (
            <div className="detail-loading">
            <span className="spinner" style={{ width:20, height:20, borderWidth:2.5 }} />
            </div>
        ) : (
            <>
            {(detail?.description || app.description || app.summary) && (
                <div className="detail-section">
                <h2 className="detail-section-title">About</h2>
                <RichText className="detail-desc" html={detail?.description || app.description || app.summary} />
                </div>
            )}
            {detail?.releases?.length > 0 && (
                <div className="detail-section">
                <h2 className="detail-section-title">What's New</h2>
                <div className="detail-release">
                <div className="detail-release-ver">v{detail.releases[0].version}</div>
                {detail.releases[0].description && (
                    <RichText className="detail-release-notes" html={detail.releases[0].description} />
                )}
                </div>
                </div>
            )}
            {detail?.permissions && Object.keys(detail.permissions).length > 0 && (
                <div className="detail-section">
                <h2 className="detail-section-title">Permissions</h2>
                <div className="detail-perms">
                {Object.entries(detail.permissions).map(([key, val]) =>
                    val && val !== 'false' && val.length !== 0
                    ? <span key={key} className="detail-perm">{key}</span>
                    : null
                )}
                </div>
                </div>
            )}
            <div className="detail-section">
            <h2 className="detail-section-title">Details</h2>
            <div className="detail-meta-grid">
            <div className="detail-meta-row"><span>App ID</span><code>{appId}</code></div>
            {detail?.project_license && <div className="detail-meta-row"><span>License</span><span>{detail.project_license}</span></div>}
            {links.bugtracker && <div className="detail-meta-row"><span>Bug Tracker</span><a href={links.bugtracker} target="_blank" rel="noreferrer">{links.bugtracker}</a></div>}
            </div>
            </div>
            </>
        )}
        </div>

        </div>
        </div>

        {lightbox && (
            <div className="lightbox" onClick={() => setLightbox(false)}>
            <button className="lightbox-close" onClick={() => setLightbox(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            </button>
            <img src={screenshots[shot]} alt="screenshot" onClick={e => e.stopPropagation()} />
            {screenshots.length > 1 && (
                <div className="lightbox-nav">
                <button onClick={prevShot}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span>{shot + 1} / {screenshots.length}</span>
                <button onClick={nextShot}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                </div>
            )}
            </div>
        )}
        </>
    );
}

const ZoomIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
const DlIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const TrashIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const LaunchIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const LinkIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
