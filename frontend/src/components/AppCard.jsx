import React, { useState } from 'react';
import { requestInstall, requestUninstall } from '../services/api';

const S = { IDLE: 0, INSTALLING: 1, INSTALLED: 2, UNINSTALLING: 3, ERR_I: 4, ERR_U: 5 };

const AppCard = React.memo(function AppCard({ app, forceInstalled = false, onUninstall, style }) {
    const [status, setStatus] = useState(forceInstalled ? S.INSTALLED : S.IDLE);
    const [imgErr, setImgErr] = useState(false);

    if (forceInstalled && status === S.IDLE) setStatus(S.INSTALLED);

    const appId   = (app.app_id || app.id || '').replace(/_/g, '.');
    const appName = app.name || app.title || 'Unknown';
    const initials = appName.slice(0, 2).toUpperCase();
    const isInstalled = status === S.INSTALLED || status === S.UNINSTALLING || status === S.ERR_U;

    const install = async () => {
        if (!appId || appId.split('.').length < 3) return;
        setStatus(S.INSTALLING);
        try { await requestInstall(appId); setStatus(S.INSTALLED); }
        catch { setStatus(S.ERR_I); }
    };

    const uninstall = async () => {
        setStatus(S.UNINSTALLING);
        try { await requestUninstall(appId); setStatus(S.IDLE); onUninstall?.(appId); }
        catch { setStatus(S.ERR_U); }
    };

    const btn = () => {
        switch (status) {
            case S.IDLE:         return <button className="btn btn-install" onClick={install}><DlIcon />Install</button>;
            case S.INSTALLING:   return <button className="btn btn-working" disabled><span className="spinner"/>Installing…</button>;
            case S.INSTALLED:    return <button className="btn btn-remove" onClick={uninstall}><TrashIcon />Uninstall</button>;
            case S.UNINSTALLING: return <button className="btn btn-working" disabled><span className="spinner"/>Removing…</button>;
            case S.ERR_I:        return <button className="btn btn-retry" onClick={install}><RetryIcon />Retry</button>;
            case S.ERR_U:        return <button className="btn btn-retry" onClick={uninstall}><RetryIcon />Retry</button>;
        }
    };

    return (
        <div className={`app-card${isInstalled ? ' installed' : ''}`} style={style}>
        <div className="card-header">
        {!imgErr && (app.icon_url || app.icon)
            ? <img className="card-icon" src={app.icon_url || app.icon} alt={appName} loading="lazy" onError={() => setImgErr(true)} />
            : <div className="card-icon-fb">{initials}</div>
        }
        <div className="card-meta">
        <div className="card-name">{appName}</div>
        {(app.categories?.[0] || app.category) &&
            <span className="card-cat">{app.categories?.[0] || app.category}</span>
        }
        </div>
        </div>
        {(app.summary || app.description) &&
            <p className="card-summary">{app.summary || app.description}</p>
        }
        <div className="card-footer">
        {isInstalled
            ? <div className="installed-badge"><ChkIcon />Installed</div>
            : <span className="card-size">{app.download_size ? `${(app.download_size/1024/1024).toFixed(0)} MB` : 'Flathub'}</span>
        }
        {btn()}
        </div>
        </div>
    );
});

export default AppCard;

const DlIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const RetryIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.57"/></svg>;
const ChkIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
