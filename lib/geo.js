
export function haversineKm(a, b) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}


export async function fetchRoute(a, b) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const json = await res.json();
  const route = json?.routes?.[0];
  if (!route) throw new Error("No route");
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    polylineCoords: route.geometry.coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    })),
  };
}
