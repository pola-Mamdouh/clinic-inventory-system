import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';

/**
 * Reusable searchable combobox / autocomplete.
 *
 * Props
 * ─────
 * value         — id of the currently selected option (string)
 * onChange      — (id: string, item: object | null) => void
 * options       — array of objects, each must have an `id` field.
 *                 Attach `_subtext` to an item to show a secondary line.
 * displayValue  — (item) => string   label shown when selected & in the list
 * filterOption  — (item, query) => boolean   search predicate
 * renderOption  — optional (item, isHighlighted) => ReactNode override
 * placeholder   — string (default "Search...")
 * icon          — Lucide icon component rendered on the left
 * emptyMessage  — text shown when no results
 * disabled      — boolean
 */
export default function ComboBox({
  value,
  onChange,
  options = [],
  displayValue,
  filterOption,
  renderOption,
  placeholder = 'Search...',
  icon: Icon,
  emptyMessage = 'No results found',
  disabled = false,
  hasError = false,
}) {
  const [open, setOpen]            = useState(false);
  const [query, setQuery]          = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [dropPos, setDropPos]      = useState({});

  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const listRef      = useRef(null);

  const selectedItem = options.find(o => o.id === value) ?? null;

  // filterOption is optional — default to matching the displayValue string
  const defaultFilter = (o, q) =>
    displayValue(o).toLowerCase().includes(q.toLowerCase());

  const filtered = query.trim()
    ? options.filter(o =>
        filterOption ? filterOption(o, query.trim()) : defaultFilter(o, query.trim())
      )
    : options;

  // Clamp highlighted index so it never exceeds the filtered list size.
  // This prevents Enter selecting undefined when the options array shrinks
  // while a ComboBox is open (e.g., a concurrent Firestore update).
  const safeHighlighted = Math.min(highlighted, Math.max(0, filtered.length - 1));

  // ── Compute fixed position (bypasses any overflow:hidden parents) ──────────
  const computePos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  }, []);

  const openMenu = () => {
    if (disabled) return;
    computePos();
    setOpen(true);
    // wait one tick so the input is rendered before we focus it
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const closeMenu = () => { setOpen(false); setQuery(''); };

  const select = (item) => { onChange(item.id, item); closeMenu(); };

  const clear = (e) => {
    e.stopPropagation();
    onChange('', null);
    closeMenu();
  };

  // ── Click-outside ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const portal = document.getElementById('combobox-portal-root');
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        !portal?.contains(e.target)
      ) closeMenu();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Reposition on scroll / resize ───────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', computePos, true);
    window.addEventListener('resize', computePos);
    return () => {
      window.removeEventListener('scroll', computePos, true);
      window.removeEventListener('resize', computePos);
    };
  }, [open, computePos]);

  // ── Reset highlight when filter changes ─────────────────────────────────────
  useEffect(() => { setHighlighted(0); }, [query]);

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); openMenu(); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted(h => Math.min(h + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted(h => Math.max(h - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[safeHighlighted]) select(filtered[safeHighlighted]);
        break;
      case 'Escape':
      case 'Tab':
        closeMenu();
        break;
      default: break;
    }
  };

  // ── Scroll highlighted item into view ────────────────────────────────────────
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.children[safeHighlighted]?.scrollIntoView({ block: 'nearest' });
  }, [safeHighlighted]);

  // ── Portal dropdown ──────────────────────────────────────────────────────────
  const dropdown = open
    ? createPortal(
        <div
          id="combobox-portal-root"
          style={{ position: 'fixed', ...dropPos, zIndex: 9999 }}
          className="bg-navy-900 border border-white/10 rounded-xl shadow-glass overflow-hidden animate-fade-in"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              {emptyMessage}
            </div>
          ) : (
            <ul ref={listRef} className="max-h-52 overflow-y-auto py-1 divide-y divide-white/[0.04]">
              {filtered.map((item, i) => (
                <li
                  key={item.id}
                  // onMouseDown prevents the input blur from firing before the click
                  onMouseDown={(e) => { e.preventDefault(); select(item); }}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                    i === safeHighlighted
                      ? 'bg-teal-500/15 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {renderOption ? (
                    renderOption(item, i === highlighted)
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {displayValue(item)}
                      </div>
                      {item._subtext && (
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {item._subtext}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ──────────────────────────────────────────────────────────── */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={openMenu}
        onKeyDown={!open ? handleKeyDown : undefined}
        className={`
          w-full flex items-center gap-2.5 bg-navy-800 border rounded-xl px-3 py-2.5
          cursor-pointer select-none transition-all
          ${open
            ? 'border-teal-500/50 ring-1 ring-teal-500/20'
            : hasError
              ? 'border-red-500/50 hover:border-red-500/60'
              : 'border-white/10 hover:border-white/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {Icon && <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />}

        {/* Show search input when open, static label when closed */}
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedItem ? displayValue(selectedItem) : placeholder}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none min-w-0"
          />
        ) : (
          <span className={`flex-1 text-sm truncate ${selectedItem ? 'text-white' : 'text-slate-500'}`}>
            {selectedItem ? displayValue(selectedItem) : placeholder}
          </span>
        )}

        {/* Clear button when something is selected, chevron otherwise */}
        {selectedItem && !open ? (
          <button
            type="button"
            onClick={clear}
            tabIndex={-1}
            aria-label="Clear selection"
            className="text-slate-500 hover:text-white transition-colors flex-shrink-0 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown
            className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {dropdown}
    </div>
  );
}
