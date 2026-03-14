import React, { useState, useRef, useEffect } from 'react';

const styles = `
.searchbar-wrapper {
    position: relative;
    width: 100%;
    max-width: 560px;
}

.searchbar-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 0 16px;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.searchbar-inner:focus-within {
    border-color: rgba(124, 106, 255, 0.5);
    background: rgba(124, 106, 255, 0.06);
    box-shadow: 0 0 0 3px rgba(124,106,255,0.12), 0 8px 32px rgba(0,0,0,0.4);
}

.searchbar-icon {
    color: #6060a0;
    flex-shrink: 0;
    transition: color 0.2s;
}

.searchbar-inner:focus-within .searchbar-icon {
    color: #7c6aff;
}

.searchbar-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Manrope', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #dcdcf0;
    padding: 14px 0;
    caret-color: #7c6aff;
}

.searchbar-input::placeholder {
    color: #4a4a72;
}

.searchbar-kbd {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    opacity: 0.5;
    transition: opacity 0.2s;
}

.searchbar-inner:focus-within .searchbar-kbd {
    opacity: 0;
}

.kbd {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 5px;
    padding: 2px 6px;
    font-family: 'Manrope', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #6060a0;
    letter-spacing: 0.02em;
}

.searchbar-clear {
    background: none;
    border: none;
    cursor: pointer;
    color: #6060a0;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
    flex-shrink: 0;
}

.searchbar-clear:hover {
    color: #dcdcf0;
    background: rgba(255,255,255,0.07);
}

.searchbar-results-count {
    position: absolute;
    bottom: -26px;
    left: 4px;
    font-size: 12px;
    color: #4a4a72;
    font-weight: 500;
    transition: opacity 0.2s;
}
`;

export default function SearchBar({ onSearch, resultCount }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    // Ctrl+K / Cmd+K shortcut to focus
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                inputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        onSearch?.(val);
    };

    const handleClear = () => {
        setQuery('');
        onSearch?.('');
        inputRef.current?.focus();
    };

    return (
        <>
        <style>{styles}</style>
        <div className="searchbar-wrapper">
        <div className="searchbar-inner">
        {/* Search icon */}
        <svg className="searchbar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
        ref={inputRef}
        className="searchbar-input"
        type="text"
        placeholder="Search apps, utilities, games…"
        value={query}
        onChange={handleChange}
        />

        {query ? (
            <button className="searchbar-clear" onClick={handleClear} aria-label="Clear search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            </button>
        ) : (
            <div className="searchbar-kbd">
            <span className="kbd">Ctrl</span>
            <span className="kbd">K</span>
            </div>
        )}
        </div>

        {query && resultCount !== undefined && (
            <div className="searchbar-results-count">
            {resultCount} result{resultCount !== 1 ? 's' : ''} found
            </div>
        )}
        </div>
        </>
    );
}
