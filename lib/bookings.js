import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKINGS_KEY = '@bookings';

export async function saveBooking(booking) {
  try {
    const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift({ ...booking, id: Date.now().toString() });
    await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(arr));
    return true;
  } catch (e) {
    console.warn('Failed to save booking', e);
    return false;
  }
}

export async function getBookings() {
  try {
    const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load bookings', e);
    return [];
  }
}

export async function clearBookings() {
  try {
    await AsyncStorage.removeItem(BOOKINGS_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

export async function getBookingStats() {
  const bookings = await getBookings();
  const totalSpent = bookings.reduce((s, b) => s + (b.price || 0), 0);
  const totalRides = bookings.length;
  const vehicleUsage = bookings.reduce((acc, b) => {
    const v = b.vehicle || b.type || 'unknown';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
  return { totalSpent, totalRides, vehicleUsage, bookings };
}