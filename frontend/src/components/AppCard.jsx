import React, { useState } from 'react';

const AppCard = React.memo(function AppCard({ app, forceInstalled, queue = {}, onInstall, onUninstall, onOpen, style }) {
    const [imgErr, setImgErr] = useState(false);
    const appId = (app.app_id || app.id || '').replace(/_/g, '.');
    const name  = app.name || app.title || 'Unknown';
    const q     = queue[appId];
    const active  = q?.status === 'installing' || q?.status === 'uninstalling';
    const done    = forceInstalled || q?.status === 'done';
    const errored = q?.status === 'error';

const btn = (e) => {
    e.stopPropagation();
    if (q?.status === 'installing')   return;
    if (q?.status === 'uninstalling') return;
    if (errored)  { onInstall?.(appId, name); return; }
    if (done)     { onUninstall?.(appId, name); return; }
    onInstall?.(appId, name);
};

const label = () => {
    if (q?.status === 'installing')   return <><span className="spinner"/>Installing…</>;
    if (q?.status === 'uninstalling') return <><span className="spinner"/>Removing…</>;
    if (errored)  return <><RetryIcon/>Retry</>;
    if (done)     return <><TrashIcon/>Uninstall</>;
    return <><DlIcon/>Install</>;
};

const btnClass = () => {
    if (active)  return 'btn btn-working';
    if (errored) return 'btn btn-retry';
    if (done)    return 'btn btn-remove';
    return 'btn btn-install';
};

return (
    <div className={`app-card${done || active ? ' installed' : ''}`} style={style} onClick={() => onOpen?.(app)}>
    {active && <div className="card-progress"><div className="card-progress-bar"/></div>}
    <div className="card-header">
    {!imgErr && (app.icon_url || app.icon)
        ? <img className="card-icon" src={app.icon_url || app.icon} alt={name} loading="lazy" onError={() => setImgErr(true)} />
        : <div className="card-icon-fb">{name.slice(0, 2).toUpperCase()}</div>}
        <div className="card-meta">
        <div className="card-name">{name}</div>
        {(app.categories?.[0] || app.category) && <span className="card-cat">{app.categories?.[0] || app.category}</span>}
        </div>
        </div>
        {(app.summary || app.description) && <p className="card-summary">{app.summary || app.description}</p>}
        <div className="card-footer">
        {done
            ? <div className="installed-badge"><ChkIcon/>Installed</div>
            : <span className="card-size">{app.download_size ? `${(app.download_size/1024/1024).toFixed(0)} MB` : 'Flathub'}</span>}
            <button className={btnClass()} disabled={active} onClick={btn}>{label()}</button>
            </div>
            </div>
);
});

export default AppCard;

const DlIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const RetryIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.57"/></svg>;
const ChkIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
