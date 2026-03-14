import React, { useState, useEffect } from 'react';
import AppCard from './AppCard';
import { checkInstalledBatch } from '../services/api';

const PAGE_SIZE = 40;

export default function AppGrid({ apps, isLoading, isLibrary = false, onUninstall }) {
    const [installedSet, setInstalledSet] = useState(new Set());
    const [visible, setVisible] = useState(PAGE_SIZE);

    useEffect(() => {
        setVisible(PAGE_SIZE);
    }, [apps]);

    useEffect(() => {
        if (isLibrary || isLoading || !apps.length) return;
        const ids = apps
        .map(a => (a.app_id || a.id || '').replace(/_/g, '.'))
        .filter(id => id && id.split('.').length >= 3);
        if (ids.length) checkInstalledBatch(ids).then(setInstalledSet).catch(() => {});
    }, [apps, isLoading, isLibrary]);

    if (isLoading) {
        return (
            <div className="grid">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="sk-card" style={{ animationDelay: `${i * 0.03}s` }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div className="sk" style={{ width:56, height:56, borderRadius:14, flexShrink:0 }} />
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                <div className="sk" style={{ height:14, width:'68%' }} />
                <div className="sk" style={{ height:11, width:'38%', borderRadius:20 }} />
                </div>
                </div>
                <div className="sk" style={{ height:11 }} />
                <div className="sk" style={{ height:11, width:'55%' }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div className="sk" style={{ height:11, width:46, borderRadius:6 }} />
                <div className="sk" style={{ height:34, width:88, borderRadius:10 }} />
                </div>
                </div>
            ))}
            </div>
        );
    }

    if (!apps.length) {
        return (
            <div className="grid">
            <div className="grid-empty">
            <svg style={{ opacity:.3 }} width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#6060a0" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            <div className="grid-empty-title">{isLibrary ? 'No installed apps' : 'No apps found'}</div>
            <div className="grid-empty-sub">{isLibrary ? 'Apps you install will appear here' : 'Try a different search or category'}</div>
            </div>
            </div>
        );
    }

    const slice = apps.slice(0, visible);

    return (
        <div className="grid">
        {slice.map((app, i) => {
            const appId = (app.app_id || app.id || '').replace(/_/g, '.');
            return (
                <AppCard
                key={appId || i}
                app={app}
                forceInstalled={isLibrary || !!app.installed || installedSet.has(appId)}
                onUninstall={onUninstall}
                style={{ animationDelay: `${Math.min(i * 0.025, 0.4)}s` }}
                />
            );
        })}
        {visible < apps.length && (
            <div className="load-more-wrap">
            <button className="load-more-btn" onClick={() => setVisible(v => v + PAGE_SIZE)}>
            Show more ({apps.length - visible} remaining)
            </button>
            </div>
        )}
        </div>
    );
}
