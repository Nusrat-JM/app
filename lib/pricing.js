import { haversineDistance } from './geo';

export function estimateRideCost(from, to, vehicleType = 'sedan') {
  const km = haversineDistance(from, to);
  const base = 50; 
  const perKmRates = {
    sedan: 20,
    suv: 30,
    cng: 15,
    bike: 8,
  };
  const rate = perKmRates[vehicleType] || perKmRates.sedan;
  const price = base + Math.max(1, km) * rate;
  return { price: Math.round(price), distanceKm: km };
}

export function estimatePackageCost(from, to, weightKg = 1) {
  const km = haversineDistance(from, to);
  const base = 80;
  const perKm = 25;
  const perKg = 10;
  const price = base + (Math.max(1, km) * perKm) + (Math.max(0.5, weightKg) * perKg);
  return { price: Math.round(price), distanceKm: km };
}

export function estimateShiftCost(from, to) {
  const km = haversineDistance(from, to);
  const base = 200; 
  const perKm = 60;
  const price = base + (Math.max(1, km) * perKm);
  return { price: Math.round(price), distanceKm: km };
}

const FARES = {
  SEDAN: { base: 60, perKm: 25, perMin: 2 },
  SUV:   { base: 90, perKm: 35, perMin: 2.5 },
  CNG:   { base: 40, perKm: 18, perMin: 1.5 },
  BIKE:  { base: 25, perKm: 12, perMin: 1 },
};

export function vehicleList() {
  return Object.keys(FARES); 
}

export function estimateFare(vehicle, km, mins) {
  const f = FARES[vehicle];
  if (!f) return 0;
  return Math.round(f.base + f.perKm * km + f.perMin * mins);
}
