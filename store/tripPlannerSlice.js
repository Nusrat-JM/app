import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { planStitchedItineraries } from '../lib/routing/stitcher';

const initialState = {
  origin: null,
  destination: null,
  waypoints: [],
  departAt: null,
  arriveBy: false,
  prefs: { priority: 'time', maxTransfers: 2, maxWalkMeters: 800, stepFreeOnly: false, avoidModes: [] },
  itineraries: [],
  loading: false,
  error: null,
};

export const planTrip = createAsyncThunk('trip/plan', async (_, { getState }) => {
  const s = getState().tripPlanner;
  if (!s.origin || !s.destination) throw new Error('Select origin and destination');
  return await planStitchedItineraries(s.origin, s.destination, {
    maxHubs: 2,
    connectorModes: ['driving','walking','bicycling'],
    priority: s.prefs.priority,
  });
});

const slice = createSlice({
  name: 'tripPlanner',
  initialState,
  reducers: {
    setOrigin: (st, a) => { st.origin = a.payload; },
    setDestination: (st, a) => { st.destination = a.payload; },
    setPriority: (st, a) => { st.prefs.priority = a.payload; },
    clearPlans: (st) => { st.itineraries = []; },
  },
  extraReducers: b => {
    b.addCase(planTrip.pending, st => { st.loading = true; st.error = null; });
    b.addCase(planTrip.fulfilled, (st,a) => { st.loading = false; st.itineraries = a.payload; });
    b.addCase(planTrip.rejected, (st,a) => { st.loading = false; st.error = a.error.message; });
  }
});

export const { setOrigin, setDestination, setPriority, clearPlans } = slice.actions;
export default slice.reducer;
