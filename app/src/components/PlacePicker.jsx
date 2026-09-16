import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, SearchField } from "../design-system";
import { searchPlaces } from "../api/onemap";
import { addressDetail } from "../lib/display";

export function PlacePicker({ value, placeholder, icon = "map-pin", onChange, onDraftChange, suggestions = [], showDetails = true }) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState(null);
  const anchor = useRef(null);
  const popup = useRef(null);
  const editing = useRef(false);
  const listId = useId();
  const expanded = open && !value && query.trim().length >= 2;

  useEffect(() => {
    if (editing.current) { editing.current = false; return; }
    setQuery(value?.name || "");
  }, [value]);

  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    setPending(true);
    setResults([]);
    setError(null);
    const timer = setTimeout(() => {
      searchPlaces(query.trim(), { signal: controller.signal })
        .then((items) => { if (!controller.signal.aborted) setResults(items || []); })
        .catch((err) => { if (!controller.signal.aborted) setError(err.message || "Search unavailable. Please try again."); })
        .finally(() => { if (!controller.signal.aborted) setPending(false); });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, expanded]);

  useLayoutEffect(() => {
    if (!expanded) return;
    const update = () => {
      const field = anchor.current?.getBoundingClientRect();
      if (!field) return;
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop || 0;
      const bottom = top + (viewport?.height || window.innerHeight);
      const fieldTop = Math.max(top + 8, Math.min(bottom - 8, field.top));
      const fieldBottom = Math.max(top + 8, Math.min(bottom - 8, field.bottom));
      const above = fieldTop - top - 8;
      const below = bottom - fieldBottom - 8;
      const up = below < 180 && above > below;
      const maxHeight = Math.max(72, Math.min(280, up ? above : below));
      setPosition({ position: "fixed", left: field.left, width: field.width, maxHeight,
        top: up ? undefined : fieldBottom + 6,
        bottom: up ? window.innerHeight - fieldTop + 6 : undefined });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [expanded]);

  useEffect(() => {
    const outside = (event) => {
      if (!anchor.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  const updateQuery = (next) => {
    if (value) { editing.current = true; onChange?.(null); }
    setQuery(next);
    setOpen(true);
    setActive(-1);
    onDraftChange?.(!!next.trim());
  };
  const choose = (result) => {
    const place = { name: result.name || result.address, address: result.address || result.name,
      postal: result.postal || null, ll: [Number(result.lat), Number(result.lng)], source: "onemap", verified: true };
    editing.current = false;
    onChange?.(place);
    onDraftChange?.(false);
    setQuery(place.name);
    setOpen(false);
    anchor.current?.querySelector("input")?.blur();
  };

  return <div style={{ position: "relative", minWidth: 0 }}>
    <div ref={anchor}>
      <SearchField value={query} placeholder={placeholder} icon={icon} onChange={updateQuery}
        onClear={() => { editing.current = false; onChange?.(null); onDraftChange?.(false); setQuery(""); setOpen(false); }}
        onFocus={() => setOpen(true)}
        onBlur={(event) => { if (event.relatedTarget && !popup.current?.contains(event.relatedTarget)) setOpen(false); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") { setOpen(false); event.preventDefault(); }
          if ((event.key === "ArrowDown" || event.key === "ArrowUp") && results.length) {
            event.preventDefault();
            setActive((index) => (index + (event.key === "ArrowDown" ? 1 : results.length - 1) + results.length) % results.length);
          }
          if (event.key === "Enter" && expanded && active >= 0 && results[active]) { event.preventDefault(); choose(results[active]); }
        }}
        role="combobox" aria-expanded={expanded} aria-controls={expanded ? listId : undefined}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined} aria-autocomplete="list" />
    </div>
    {value && showDetails && <div className="sv-place-detail">
      <Icon name={value.verified ? "check" : "triangle-alert"} size={13} />
      <span>{value.verified ? addressDetail(value.address, value.postal) : "Select a search result to verify this place."}</span>
    </div>}
    {!value && suggestions.length > 0 && query.trim().length < 2 && <div className="sv-place-suggestions">
      {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => updateQuery(suggestion)}>{suggestion}</button>)}
    </div>}
    {open && !value && query.trim().length === 1 && <div className="sv-place-detail">Type at least 2 characters to search.</div>}
    {expanded && position && createPortal(<div ref={popup} id={listId} role="listbox" aria-label="Matching places" className="sv-place-results" style={position}>
      {pending && <div role="status">Searching OneMap…</div>}
      {!pending && error && <div role="alert">{error}</div>}
      {!pending && !error && !results.length && <div>No matching address. Try a postal code or building name.</div>}
      {!pending && results.map((result, index) => <button type="button" role="option" aria-selected={active === index} id={`${listId}-${index}`}
        key={`${index}-${result.lat}-${result.lng}`} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(result)}>
        <strong>{result.name || result.address}</strong>
        <span>{addressDetail(result.address, result.postal)}</span>
      </button>)}
    </div>, document.body)}
  </div>;
}
