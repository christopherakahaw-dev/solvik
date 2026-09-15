/* OneMapCanvas — fork of Solvik's MapCanvas with OneMap (Singapore Land Authority)
   raster tiles instead of OpenStreetMap, and props that update after mount.
   Keeps the system's warm filter, dotted green route and ink position dot. */
const isLL = (v) => Array.isArray(v) && v.length >= 2 && isFinite(v[0]) && isFinite(v[1]);

function OneMapCanvas({
  center, zoom, route, marker, dest, pin, zones, onMapClick, onZoneClick,
  height = 320, interactive = true, style, fitRoute = true, zoomControls = true, zoomInset = 12, zoomTop = '50%',
}) {
  const R = window.React;
  const safeCenter = isLL(center) ? center : [1.3521, 103.8198];
  const safeZoom = isFinite(zoom) ? zoom : 12;
  const safeRoute = Array.isArray(route) ? route.filter(isLL) : [];
  const safeZones = Array.isArray(zones) ? zones.filter((z) => z && isLL(z.ll)) : [];
  const ref = R.useRef(null);
  const mapRef = R.useRef(null);
  const layersRef = R.useRef([]);
  const clickRef = R.useRef(onMapClick);
  clickRef.current = onMapClick;
  const clickZoneRef = R.useRef(onZoneClick);
  clickZoneRef.current = onZoneClick;

  R.useEffect(() => {
    const L = window.L;
    if (!L || !ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      center: safeCenter, zoom: safeZoom, zoomControl: false, attributionControl: false,
      dragging: interactive, scrollWheelZoom: interactive, doubleClickZoom: interactive,
      touchZoom: interactive, keyboard: interactive, zoomSnap: 0.5, zoomDelta: 0.5, wheelPxPerZoomLevel: 90,
    });
    const onemap = L.tileLayer('https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png', {
      minZoom: 11, maxZoom: 19,
    }).addTo(map);
    // OneMap serves Singapore only and is occasionally rate-limited; fall back
    // to OSM so the canvas never renders blank.
    let fellBack = false;
    onemap.on('tileerror', () => {
      if (fellBack) return;
      fellBack = true;
      map.removeLayer(onemap);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    });
    map.on('click', (e) => { if (clickRef.current) clickRef.current([e.latlng.lat, e.latlng.lng]); });
    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(ref.current);
    }
    return () => { if (ro) ro.disconnect(); map.remove(); mapRef.current = null; };
  }, []);

  R.useEffect(() => {
    const L = window.L, map = mapRef.current;
    if (!L || !map) return;
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];
    const green = getComputedStyle(document.documentElement).getPropertyValue('--map-route').trim() || '#437858';
    if (safeRoute.length > 1) {
      const line = L.polyline(safeRoute, { color: green, weight: 5, opacity: 1, dashArray: '1 11', lineCap: 'round' }).addTo(map);
      layersRef.current.push(line);
      if (fitRoute) map.fitBounds(line.getBounds(), { padding: [34, 34] });
    }
    if (isLL(marker)) {
      const m = L.circleMarker(marker, { radius: 8, color: '#fff', weight: 3, fillColor: '#201e1d', fillOpacity: 1 }).addTo(map);
      layersRef.current.push(m);
    }
    if (isLL(pin)) {
      const rust = getComputedStyle(document.documentElement).getPropertyValue('--crowd-busy').trim() || '#b3402c';
      const halo = L.circleMarker(pin, { radius: 16, color: rust, weight: 2, opacity: .45, fillColor: rust, fillOpacity: .12 }).addTo(map);
      const p = L.circleMarker(pin, { radius: 8, color: '#fff', weight: 3, fillColor: rust, fillOpacity: 1 }).addTo(map);
      layersRef.current.push(halo, p);
    }
    if (isLL(dest)) {
      const d = L.circleMarker(dest, { radius: 9, color: '#fff', weight: 3, fillColor: green, fillOpacity: 1 }).addTo(map);
      layersRef.current.push(d);
    }
    if (safeZones.length) {
      const cs = getComputedStyle(document.documentElement);
      const tone = (lv) => cs.getPropertyValue('--crowd-' + (lv || 'light')).trim() || '#437858';
      safeZones.forEach((z) => {
        const c = tone(z.level);
        const sel = !!z.selected;
        const ring = L.circle(z.ll, {
          radius: z.radius || 1400, color: sel ? '#201e1d' : c, weight: sel ? 2.5 : 1.5, opacity: sel ? .85 : .5,
          fillColor: c, fillOpacity: z.level === 'busy' ? .3 : z.level === 'moderate' ? .22 : .15,
        }).addTo(map);
        if (clickZoneRef.current) ring.on('click', (e) => { e.originalEvent && e.originalEvent.stopPropagation(); clickZoneRef.current(z.id); });
        layersRef.current.push(ring);
        if (z.label) {
          const m = L.marker(z.ll, {
            interactive: !!clickZoneRef.current,
            icon: L.divIcon({
              className: '',
              html: '<div style="transform:translate(-50%,-50%);white-space:nowrap;display:flex;align-items:center;gap:5px;cursor:pointer;'
                + 'padding:' + (sel ? '5px 10px' : '3px 8px') + ';border-radius:999px;background:' + (sel ? '#201e1d' : 'rgba(255,255,255,.94)') + ';'
                + 'box-shadow:0 2px 6px rgba(32,30,29,.16);'
                + 'font:700 ' + (sel ? '12px' : '11px') + '/1 Archivo,sans-serif;color:' + (sel ? '#fff' : '#3a3a36') + '">'
                + '<span style="width:7px;height:7px;border-radius:999px;background:' + c + '"></span>'
                + z.label + (z.pct ? '<span style="opacity:.62;font-weight:600">' + z.pct + '</span>' : '') + '</div>',
              iconSize: [0, 0],
            }),
          }).addTo(map);
          if (clickZoneRef.current) m.on('click', () => clickZoneRef.current(z.id));
          layersRef.current.push(m);
        }
      });
    }
  }, [JSON.stringify(safeRoute), JSON.stringify(marker), JSON.stringify(dest), JSON.stringify(pin), JSON.stringify(safeZones)]);

  R.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLL(center)) return;
    if (safeRoute.length && fitRoute) return;
    if (Math.abs(map.getZoom() - safeZoom) > 0.01) map.setView(center, safeZoom, { animate: false });
    else map.panTo(center, { animate: true, duration: .8 });
  }, [JSON.stringify(center), safeZoom, fitRoute]);

  const zBtn = (label, delta, radius) => R.createElement('button', {
    key: label,
    'aria-label': delta > 0 ? 'Zoom in' : 'Zoom out',
    onClick: (e) => { e.stopPropagation(); const m = mapRef.current; if (m) m.setZoom(m.getZoom() + delta); },
    style: {
      width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-card,#fff)', border: 'none', cursor: 'pointer',
      font: '600 21px/1 Archivo,sans-serif', color: 'var(--text-strong,#201e1d)',
      borderRadius: radius, borderBottom: delta > 0 ? '1px solid var(--border-card,rgba(32,30,29,.12))' : 'none',
    },
  }, label);

  return R.createElement('div', {
    style: { position: 'relative', height, background: 'var(--map-land)', overflow: 'hidden', ...style },
  }, R.createElement('div', {
    ref,
    style: { position: 'absolute', inset: 0, filter: 'saturate(.72) sepia(.12) brightness(1.03) contrast(.96)' },
  }), interactive && zoomControls ? R.createElement('div', {
    style: {
      position: 'absolute', right: zoomInset, top: zoomTop, transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 6px 18px rgba(32,30,29,.18)', zIndex: 500,
    },
  }, [zBtn('+', 1, '14px 14px 0 0'), zBtn('\u2212', -1, '0 0 14px 14px')]) : null);
}

window.OneMapCanvas = OneMapCanvas;
if (typeof module !== 'undefined') module.exports = { OneMapCanvas };
