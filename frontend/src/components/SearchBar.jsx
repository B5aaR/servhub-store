import React, { useState, useRef, useEffect } from 'react';

export default function SearchBar({ onSearch, placeholder = 'Search apps, utilities, games…', resultCount }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); }
            if (e.key === 'Escape') inputRef.current?.blur();
        };
            window.addEventListener('keydown', handler);
            return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleChange = (e) => { setQuery(e.target.value); onSearch?.(e.target.value); };

    const clear = () => { setQuery(''); onSearch?.(''); inputRef.current?.focus(); };

    return (
        <div className="searchbar-wrap">
        <div className="searchbar-inner">
        <svg className="searchbar-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input ref={inputRef} className="searchbar-input" type="text" placeholder={placeholder} value={query} onChange={handleChange} />
        {query ? (
            <button className="searchbar-clear" onClick={clear} aria-label="Clear">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            </button>
        ) : (
            <div className="searchbar-kbd"><span className="kbd">Ctrl</span><span className="kbd">K</span></div>
        )}
        </div>
        {query && resultCount !== undefined && (
            <div className="searchbar-count">{resultCount} result{resultCount !== 1 ? 's' : ''}</div>
        )}
        </div>
    );
}
