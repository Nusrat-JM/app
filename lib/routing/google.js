import { API_BASE } from '../routing/baseURL';
import polyline from 'polyline';

const decode = (p) => polyline.decode(p).map(([lat,lng]) => ({ latitude: lat, longitude: lng }));

export async function fetchDriving(origin, destination) {
  const qs = `origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
  const r = await fetch(`${API_BASE}/routing/driving?${qs}`);
  if (!r.ok) throw new Error('driving failed');
  const arr = await r.json();

  return arr.map(rt => ({
    ...rt,
    overviewCoords: rt.overview ? decode(rt.overview) : [],
    steps: rt.steps.map(s => ({
      coords: s.polyline ? decode(s.polyline) : [],
      distance: s.distance,
      duration: s.duration,
      durationTraffic: s.durationTraffic,
    })),
  }));
}
