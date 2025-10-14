import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './routing/baseURL';

const TOKEN_KEY = 'token';
export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const logout = () => AsyncStorage.removeItem(TOKEN_KEY);

async function saveToken(token) { await AsyncStorage.setItem(TOKEN_KEY, token); }

export async function signup({ name, phone, email, password }) {
  const r = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Signup failed');
  if (data.token) await saveToken(data.token);
  return data.user;
}

export async function login({ identifier, password }) {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }), 
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Login failed');
  if (data.token) await saveToken(data.token);
  return data.user;
}

export async function fetchMe() {
  const token = await getToken();
  if (!token) return null;
  const r = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return r.json();
}
