// hooks/useAuth.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as api from '../lib/apiAuth'; // <-- uses your existing apiAuth.js

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to persist auth bits safely
  const persistAuth = useCallback(async (maybeUser, maybeToken) => {
    const u = maybeUser?.user || maybeUser || null;
    const t = maybeUser?.token || maybeToken || null;

    if (t) {
      await SecureStore.setItemAsync('token', String(t));
      await AsyncStorage.setItem('token', String(t)); // optional mirror
    }
    if (u?.id) {
      await SecureStore.setItemAsync('rider_id', String(u.id));
      await AsyncStorage.setItem('rider_id', String(u.id)); // optional mirror
      await AsyncStorage.setItem('@user', JSON.stringify(u));
    }
    if (u) setUser(u);
  }, []);

  // Load existing session (token) and fetch /auth/me on app start
  useEffect(() => {
    (async () => {
      try {
        const me = await api.fetchMe(); // returns null if no/invalid token
        if (me) {
          // Save minimal info for other parts that read rider_id
          await SecureStore.setItemAsync('rider_id', String(me.id));
          await AsyncStorage.setItem('@user', JSON.stringify(me));
          setUser(me);
        } else {
          // Fallback to cached user or just rider_id
          const rawUser = await AsyncStorage.getItem('@user');
          if (rawUser) {
            setUser(JSON.parse(rawUser));
          } else {
            const rid =
              (await SecureStore.getItemAsync('rider_id')) ||
              (await AsyncStorage.getItem('rider_id'));
            if (rid) setUser({ id: Number(rid) }); // minimal shape so shipments can use rider_id
          }
        }
      } catch (e) {
        console.warn('Auth init failed:', e?.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- SIGNUP (name, phone, email, password) ----
  const signup = useCallback(async ({ name, phone, email, password }) => {
    try {
      const res = await api.signup({ name, phone, email, password }); // expected { user, token } or user
      await persistAuth(res); // saves token + rider_id when present
      return true;
    } catch (e) {
      Alert.alert('Signup failed', e?.message || 'Please try again');
      return false;
    }
  }, [persistAuth]);

  // ---- LOGIN (email OR phone via "identifier", + password) ----
  const login = useCallback(async (payload) => {
    try {
      // Support both shapes: {identifier, password}  OR  {email, password}
      const identifier = payload?.identifier ?? payload?.email;
      const { password } = payload;
      if (!identifier || !password) {
        Alert.alert('Missing info', 'Please enter your email/phone and password');
        return false;
      }

      const res = await api.login({ identifier, password }); // expected { user, token } or user
      await persistAuth(res); // saves token + rider_id when present
      return true;
    } catch (e) {
      Alert.alert('Login failed', e?.message || 'Invalid credentials');
      return false;
    }
  }, [persistAuth]);

  // ---- LOGOUT ----
  const logout = useCallback(async () => {
    try {
      await api.logout(); // should remove token from SecureStore if your apiAuth does it
      await AsyncStorage.removeItem('@user');
      // Also make sure rider_id mirrors are cleared
      await SecureStore.deleteItemAsync('rider_id');
      await AsyncStorage.removeItem('rider_id');
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
