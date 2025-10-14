// screens/ticketApi.js
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../lib/routing/baseURL";

async function getToken() {
  return (await SecureStore.getItemAsync("token")) || (await AsyncStorage.getItem("token"));
}

async function authed(method, path, body) {
    const token = await getToken();
    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      // Network/DNS/SSL errors never have JSON – bubble a clean message
      throw { status: 0, data: { message: `Network error: ${e.message}` } };
    }
  
    const raw = await res.text();
    let data;
    try { data = raw ? JSON.parse(raw) : {}; }
    catch { data = { message: raw }; }
  
    if (!res.ok) {
      // Normalize common keys so UI can show it
      const message = data?.message || data?.error || `HTTP ${res.status}`;
      throw { status: res.status, data: { ...data, message } };
    }
    return data;
  }
  

export async function createTicket(payload) {
  return authed("POST", "/tickets", payload);
}

export async function payTicket(ticketId, body) {
  return authed("PATCH", `/tickets/${ticketId}/pay`, body);
}

export async function getTicketDashboard(period = "30d") {
  return authed("GET", `/dashboard/ticket?period=${encodeURIComponent(period)}`);
}
