exports.directionsDriving = async ({ origin, destination }) => {
  const params = new URLSearchParams({
    origin, destination,
    mode: 'driving',
    alternatives: 'true',
    departure_time: 'now',          // enables duration_in_traffic
    traffic_model: 'best_guess',
    key: K
  });
  const r = await fetch(`${BASE}/directions/json?${params}`);
  const data = await r.json();
  if (data.status !== 'OK') throw new Error(data.error_message || data.status);
  return data;
};
