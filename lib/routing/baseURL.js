import { Platform } from 'react-native';
export const API_BASE = 'http://192.168.1.9:3000';
Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
// For physical phone on same Wi-Fi, use your PC IP, e.g.
//192.168.0.179

