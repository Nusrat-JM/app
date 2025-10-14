import { DHAKA_HUBS } from './hubs';
import { getConnectorLeg, getTransitLeg } from './google';

const CO2_gpm = { WALK:0, BIKE:0, RIDE_HAIL:170, BUS:70, METRO:30, TRAIN:35, FERRY:250 };
const FARE_pkm = { WALK:0, BIKE:0, RIDE_HAIL:28, BUS:3, METRO:5, TRAIN:4, FERRY:6 };

function haversine(a, b) {
  const R = 6371e3, toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const s = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
function nearestHubs(p, n){ return [...DHAKA_HUBS].sort((h1,h2)=>haversine(p,h1)-haversine(p,h2)).slice(0,n); }

function estimate(it){
  let co2=0,cost=0;
  it.legs.forEach(l=>{
    const km = l.distanceMeters/1000;
    co2 += (CO2_gpm[l.mode] || 0) * km;
    cost += (FARE_pkm[l.mode] || 0) * km;
  });
  it.totalCo2g = Math.round(co2);
  it.totalCost = Math.round(cost);
}

export async function planStitchedItineraries(origin, destination, opts = {}) {
  const maxHubs = opts.maxHubs || 2;
  const modes = opts.connectorModes || ['driving','walking','bicycling'];
  const priority = opts.priority || 'time';

  const oHubs = nearestHubs(origin, maxHubs);
  const dHubs = nearestHubs(destination, maxHubs);

  const candidates = [];

  for (const oh of oHubs) for (const dh of dHubs)
    for (const m1 of modes) for (const m3 of modes) {
      try {
        const leg1 = await getConnectorLeg(origin, oh, m1);
        const leg2 = await getTransitLeg(oh, dh);
        const leg3 = await getConnectorLeg(dh, destination, m3);

        const legs = [leg1, leg2, leg3];
        const totalDurationSec = legs.reduce((a,l)=>a+l.durationSec,0);

        const it = {
          id: `it_${Math.random().toString(36).slice(2)}`,
          legs,
          totalDurationSec,
          transfers: 1,
          score: { time: totalDurationSec, cost: 0, co2: 0, reliability: 0.8 },
          label: 'Recommended',
        };
        estimate(it);
        const w = { time:0.45, cost:0.25, co2:0.2, reliability:0.1 };
        w[priority]+=0.25;
        it.__scoreRaw = w.time*it.totalDurationSec + w.cost*it.totalCost + w.co2*it.totalCo2g + w.reliability*(1-it.score.reliability)*1000;
        candidates.push(it);
      } catch(e) {}
    }

  const uniq = new Map();
  candidates.forEach(it=>{
    const key = Math.round(it.__scoreRaw/60);
    if (!uniq.has(key) || it.__scoreRaw < uniq.get(key).__scoreRaw) uniq.set(key, it);
  });
  const top = [...uniq.values()].sort((a,b)=>a.__scoreRaw-b.__scoreRaw).slice(0,5);
  const labels = ['Recommended','Fastest','Cheapest','Lowest CO₂','Fewest transfers'];
  top.forEach((it,i)=> it.label = labels[i] || 'Recommended');
  return top;
}
