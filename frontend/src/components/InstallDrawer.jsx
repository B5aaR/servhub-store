import React, { useRef, useEffect, useState } from 'react';

export default function InstallDrawer({ queue, onClose }) {
    const [selected, setSelected] = useState(null);
    const logRef = useRef(null);
    const entries = Object.values(queue);
    const current = selected ? queue[selected] : entries[0];

    useEffect(() => {
        if (entries.length && !selected) setSelected(entries[0].appId);
    }, [entries.length]);

        useEffect(() => {
            if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }, [queue, selected]);

            if (!entries.length) return null;

            const isActive = s => s === 'installing' || s === 'uninstalling';

    return (
        <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="drawer">
        <div className="drawer-header">
        <div className="drawer-title">
        Activity
        {entries.filter(e => isActive(e.status)).length > 0 && (
            <span className="drawer-active-badge">
            {entries.filter(e => isActive(e.status)).length} active
            </span>
        )}
        </div>
        <button className="drawer-close" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        </button>
        </div>

        <div className="drawer-body">
        <div className="drawer-sidebar">
        {entries.map(entry => (
            <button
            key={entry.appId}
            className={`drawer-item${selected === entry.appId ? ' active' : ''}`}
            onClick={() => setSelected(entry.appId)}
            >
            <div className="drawer-item-name">{entry.name || entry.appId}</div>
            <div className={`drawer-item-status ${entry.status}`}>
            {isActive(entry.status) ? (
                <><span className="drawer-spinner"/>{entry.status === 'uninstalling' ? 'Removing' : 'Installing'}</>
            ) : entry.status === 'done' ? (
                <><DoneIcon/>Done</>
            ) : (
                <><ErrIcon/>Failed</>
            )}
            </div>
            {isActive(entry.status) && (
                <div className="drawer-progress"><div className="drawer-progress-bar"/></div>
            )}
            </button>
        ))}
        </div>

        <div className="drawer-log-panel">
        <div className="drawer-log-title">
        {current?.name || current?.appId}
        <span className="drawer-log-label">Output</span>
        </div>
        <div className="drawer-log" ref={logRef}>
        {current?.logs?.length
            ? current.logs.map((line, i) => <div key={i} className="drawer-log-line">{line}</div>)
            : <div className="drawer-log-empty">Waiting for output…</div>
        }
        </div>
        </div>
        </div>
        </div>
        </div>
    );
}

const DoneIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const ErrIcon  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
