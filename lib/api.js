// lib/api.js
import { API_BASE } from './routing/baseURL';
import AsyncStorage from '@react-native-async-storage/async-storage';

let AUTH_TOKEN; // undefined = not loaded yet, null = loaded & missing

export function setAuthToken(token) {
  AUTH_TOKEN = token || null;
}

async function ensureToken() {
  if (AUTH_TOKEN === undefined) {
    try {
      const saved = await AsyncStorage.getItem('token');
      AUTH_TOKEN = saved || null;
    } catch {
      AUTH_TOKEN = null;
    }
  }
  return AUTH_TOKEN;
}

async function req(path, { method = 'GET', body, headers } = {}) {
  await ensureToken();
  const h = { 'Content-Type': 'application/json', ...(headers || {}) };
  if (AUTH_TOKEN) h.Authorization = `Bearer ${AUTH_TOKEN}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Request failed: ${res.status}`);
  }
  return data;
}


export async function getVehicleTypes() { return req('/vehicle-types'); }
export async function createUser({ name, email, phone }) {
  return req('/users', { method: 'POST', body: { name, email, phone } });
}
export async function getRides(userId) {
  const qs = userId ? `?rider_id=${encodeURIComponent(userId)}` : '';
  return req(`/rides${qs}`);
}

/*Shipments (packages) */
export function createShipment(payload) {
  // rider_id comes from JWT on the server
  return req('/shipments', { method: 'POST', body: payload });
}
export function getShipment(shipmentId) {
  return req(`/shipments/${shipmentId}`);
}
export function getLatestLocation(shipmentId) {
  return req(`/shipments/${shipmentId}/latest-location`);
}
export function postCourierLocation(shipmentId, { lat, lng, heading = 0, speed = 0 }) {
  return req(`/shipments/${shipmentId}/locations`, {
    method: 'POST',
    body: { lat, lng, heading, speed },
  });
}
