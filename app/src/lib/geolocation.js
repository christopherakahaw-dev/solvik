// Promise wrapper around the browser geolocation API, with a cache of the
// last successful fix so separate screens (map, report) don't each trigger a
// permission prompt. Requires a secure context: works on localhost and over
// HTTPS, not on a plain-HTTP LAN address.

let lastFix = null; // { coords: [lat, lng], accuracy, at }

const OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 };

function normalizeError(err) {
  if (!err) return { code: "unavailable" };
  if (err.code === 1) return { code: "denied" };
  if (err.code === 3) return { code: "timeout" };
  return { code: "unavailable" };
}

export function getLastPosition() {
  return lastFix;
}

export function getPosition() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject({ code: "unsupported" });
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lastFix = {
          coords: [pos.coords.latitude, pos.coords.longitude],
          accuracy: pos.coords.accuracy,
          at: Date.now(),
        };
        resolve(lastFix);
      },
      (err) => reject(normalizeError(err)),
      OPTIONS
    );
  });
}

export function messageForError(code) {
  if (code === "denied") return "Location permission denied — allow it in your browser settings";
  if (code === "unsupported") return "Location isn't available on this device";
  if (code === "timeout") return "Location is taking too long — try again";
  return "Couldn't get your location";
}
