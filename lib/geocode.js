// lib/geocode.js
const NOM_BASE = "https://nominatim.openstreetmap.org";
const PHOTON_BASE = "https://photon.komoot.io";

// Build a small bias box around a center (in degrees)
function buildViewbox(near, dLat = 0.25, dLng = 0.25) {
  const south = near.latitude - dLat;
  const north = near.latitude + dLat;
  const west  = near.longitude - dLng;
  const east  = near.longitude + dLng;
  // format: lonW,latN,lonE,latS
  return `${west},${north},${east},${south}`;
}

// ---------- Nominatim ----------
async function nominatimSearch(query, { country = "bd", near = null, limit = 8 }) {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: String(limit),
    // do NOT set "bounded=1"; we only bias, not restrict
  });
  if (country) params.set("countrycodes", country);
  if (near && Number.isFinite(near.latitude) && Number.isFinite(near.longitude)) {
    params.set("viewbox", buildViewbox(near)); // bias only
  }

  const url = `${NOM_BASE}/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "openapp/1.0 (contact: youremail@example.com)"
    }
  });
  const j = await res.json();

  return (j || []).map(item => ({
    id: `nominatim:${item.place_id}`,
    name: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
    bbox: item.boundingbox
      ? {
          south: Number(item.boundingbox[0]),
          north: Number(item.boundingbox[1]),
          west:  Number(item.boundingbox[2]),
          east:  Number(item.boundingbox[3]),
        }
      : null,
    source: "nominatim",
    placeType: item.type,   // suburb, city, etc.
    placeClass: item.class, // place, highway, building...
  }));
}

// ---------- Photon (Komoot) fallback ----------
async function photonSearch(query, { near = null, limit = 8 }) {
  const params = new URLSearchParams({
    q: query,
    lang: "en",
    limit: String(limit)
  });
  if (near && Number.isFinite(near.latitude) && Number.isFinite(near.longitude)) {
    params.set("lat", String(near.latitude));
    params.set("lon", String(near.longitude));
  }
  const url = `${PHOTON_BASE}/api/?${params.toString()}`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const j = await res.json();
  const feats = j?.features || [];

  return feats.map((f, idx) => {
    const [lon, lat] = f.geometry?.coordinates || [];
    const ext = f.properties?.extent; // [west, south, east, north]
    return {
      id: `photon:${f.properties?.osm_id ?? idx}`,
      name: f.properties?.name
        ? `${f.properties.name}${f.properties.city ? ", " + f.properties.city : ""}${f.properties.country ? ", " + f.properties.country : ""}`
        : f.properties?.label || "Unnamed",
      lat: Number(lat),
      lng: Number(lon),
      bbox: Array.isArray(ext) && ext.length === 4
        ? { west: Number(ext[0]), south: Number(ext[1]), east: Number(ext[2]), north: Number(ext[3]) }
        : null,
      source: "photon",
      placeType: f.properties?.type,   // city, suburb, village...
      placeClass: "place",
    };
  });
}

// ---------- Re-rank: prefer Bangladesh + admin places ----------
function scoreResult(r) {
  let s = 0;
  const n = (r.name || "").toLowerCase();
  if (n.includes("bangladesh")) s += 3;
  if (n.includes("dhaka")) s += 2;
  // prefer administrative hierarchy
  const type = (r.placeType || "").toLowerCase();
  if (["city", "town"].includes(type)) s += 2;
  if (["suburb", "district", "neighbourhood", "quarter", "ward", "thana"].includes(type)) s += 1;
  // bbox (area) often better than point for ambiguous names
  if (r.bbox) s += 1;
  return s;
}

function dedupe(results) {
  const seen = new Set();
  const out = [];
  for (const r of results) {
    const k = `${r.name}|${r.lat.toFixed(6)}|${r.lng.toFixed(6)}`;
    if (!seen.has(k)) { seen.add(k); out.push(r); }
  }
  return out;
}

/**
 * Unified search (OSM only) with bias + nationwide retry + Photon fallback.
 * @param {string} query
 * @param {{ country?: string, near?: {latitude:number, longitude:number}, limit?: number }} opts
 */
export async function searchPlaces(query, opts = {}) {
  const { country = "bd", near = null, limit = 8 } = opts;
  if (!query || query.trim().length < 2) return [];

  // 1) Nominatim with viewport bias
  let results = await nominatimSearch(query, { country, near, limit });

  // 2) If too few, try Nominatim nationwide (no bias)
  if (results.length < 2) {
    const nationwide = await nominatimSearch(query, { country, near: null, limit });
    results = results.concat(nationwide);
  }

  // 3) If still weak, fallback to Photon
  if (results.length < 2) {
    const photon = await photonSearch(query, { near, limit });
    results = results.concat(photon);
  }

  // Dedupe + sort by score desc
  results = dedupe(results).sort((a, b) => scoreResult(b) - scoreResult(a));
  return results.slice(0, limit);
}

export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    format: "json",
    lat: String(lat),
    lon: String(lng),
  });
  const url = `${NOM_BASE}/reverse?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "openapp/1.0 (contact: youremail@example.com)"
    }
  });
  const j = await res.json();
  return j?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
