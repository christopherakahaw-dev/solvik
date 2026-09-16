import { useEffect, useRef, useState } from "react";
import { Icon, SearchField } from "../design-system";
import { searchPlaces } from "../api/onemap";

export function PlacePicker({ value, placeholder, icon = "map-pin", onChange, suggestions = [], showDetails = true }) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const requestRef = useRef(null);
  const previousValueNameRef = useRef(value?.name || "");

  // Saved-place shortcuts can update this picker from outside. Keep the text
  // in sync without erasing the first character when a user starts editing an
  // existing selection (that edit intentionally clears `value`).
  useEffect(() => {
    const nextName = value?.name || "";
    const previousName = previousValueNameRef.current;
    if (nextName !== previousName) {
      setQuery((current) => nextName || (current === previousName ? "" : current));
      previousValueNameRef.current = nextName;
    }
  }, [value?.name]);

  useEffect(() => {
    if (requestRef.current) requestRef.current.abort();
    const trimmed = query.trim();
    if (!open || value || trimmed.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    const timer = setTimeout(() => {
      searchPlaces(trimmed, { signal: controller.signal })
        .then((items) => {
          if (controller.signal.aborted) return;
          setResults(items || []);
          setPending(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setPending(false);
          setError(String(err?.message || err));
        });
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, value]);

  const updateQuery = (next) => {
    if (value) onChange?.(null);
    setQuery(next);
    setOpen(true);
    setPending(next.trim().length >= 2);
    setError(null);
    if (next.trim().length < 2) setResults([]);
  };

  const choose = (result) => {
    const place = {
      name: result.name || result.address,
      address: result.address || result.name,
      postal: result.postal || null,
      ll: [Number(result.lat), Number(result.lng)],
      source: "onemap",
      verified: true,
    };
    onChange?.(place);
    setQuery(place.name);
    setResults([]);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <SearchField
        value={query}
        placeholder={placeholder}
        icon={icon}
        onChange={updateQuery}
        onClear={() => {
          onChange?.(null);
          setQuery("");
          setResults([]);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          if (!value && query.trim().length >= 2) setPending(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        role="combobox"
        aria-expanded={open && !value && query.trim().length >= 2}
        aria-autocomplete="list"
      />

      {value && showDetails && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginTop: 7, font: "var(--type-caption)", color: value.verified ? "var(--text-muted)" : "var(--status-fault)" }}>
          <Icon name={value.verified ? "check" : "triangle-alert"} size={13} style={{ flex: "none", marginTop: 1 }} />
          <span style={{ textWrap: "pretty" }}>
            {value.verified
              ? [value.address, value.postal].filter(Boolean).join(" · ")
              : "Previously saved text — select a OneMap result to verify this place."}
          </span>
        </div>
      )}

      {!value && suggestions.length > 0 && query.trim().length < 2 && (
        <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
          {suggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onClick={() => updateQuery(suggestion)}
              style={{ padding: "8px 13px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap", font: "var(--weight-bold) 12px/1 var(--font-body)", background: "var(--accent-soft)", border: "1px solid var(--border-card)", color: "var(--text-body)" }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {open && !value && query.trim().length >= 2 && (
        <div role="listbox" style={{ position: "absolute", top: "calc(100% + 7px)", left: 0, right: 0, zIndex: 40, maxHeight: 260, overflowY: "auto", background: "var(--surface-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-raised)" }}>
          {pending && <div style={{ padding: 13, font: "var(--type-caption)", color: "var(--text-muted)" }}>Searching OneMap…</div>}
          {!pending && error && <div style={{ padding: 13, font: "var(--type-caption)", color: "var(--status-fault)" }}>{error}</div>}
          {!pending && !error && results.length === 0 && (
            <div style={{ padding: 13, font: "var(--type-caption)", color: "var(--text-muted)" }}>No matching address yet.</div>
          )}
          {results.map((result, index) => (
            <button
              type="button"
              role="option"
              key={`${result.postal || index}-${result.lat}-${result.lng}`}
              onPointerDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => choose(result)}
              style={{ display: "block", width: "100%", padding: "12px 13px", textAlign: "left", cursor: "pointer", background: "var(--surface-card)", border: "none", borderBottom: "1px solid var(--border-card)", color: "var(--text-strong)" }}
            >
              <span style={{ display: "block", font: "var(--type-body-strong)", textWrap: "pretty" }}>{result.name || result.address}</span>
              <span style={{ display: "block", marginTop: 3, font: "var(--type-caption)", color: "var(--text-muted)", textWrap: "pretty" }}>
                {[result.address, result.postal].filter(Boolean).join(" · ")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
