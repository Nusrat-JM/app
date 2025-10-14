// index.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3308),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

app.use((req,_res,next)=>{ console.log('[API]', req.method, req.url); next(); });
app.get('/', (_req,res)=>res.send('API OK'));
app.get('/health/db', async (_req,res)=>{
  try { await pool.query('SELECT 1'); res.send('DB OK'); }
  catch(e){ res.status(500).send(e.message); }
});

/* ---------- Auth helpers ---------- */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }
}
function softAuth(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (token) { try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch {} }
  next();
}
async function findUserByEmailOrPhone(identifier) {
  if (!identifier) return null;
  const looksEmail = identifier.includes('@');
  let sql, param;
  if (looksEmail) {
    sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    param = identifier.toLowerCase();
  } else {
    const digits = identifier.replace(/\D/g, '');
    sql = 'SELECT * FROM users WHERE REPLACE(REPLACE(REPLACE(phone, "+", ""), "-", ""), " ", "") = ? LIMIT 1';
    param = digits;
  }
  const [rows] = await pool.query(sql, [param]);
  return rows[0];
}
/* ---------- Ticket helpers (NEW) ---------- */
const TICKET_MODES = new Set(['bus','train','hotel','ferry','plane']);

function genPNR(n = 6) {
  // random, uppercase, alphanumeric
  return crypto.randomBytes(8)
    .toString('base64')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, n)
    .toUpperCase();
}

/** Make sure a row exists in `riders` for this user id (rider_id = users.id). */
async function ensureRiderRow(userId) {
  const [[r]] = await pool.query(
    'SELECT rider_id FROM riders WHERE rider_id=? LIMIT 1',
    [userId]
  );
  if (!r) {
    const [[u]] = await pool.query(
      'SELECT id, name, phone, email FROM users WHERE id=? LIMIT 1',
      [userId]
    );
    if (u) {
      await pool.query(
        'INSERT INTO riders (rider_id, name, phone, email) VALUES (?,?,?,?)',
        [u.id, u.name || null, u.phone || null, u.email || null]
      );
    }
  }
}

/* ---------- AUTH ---------- */
app.post(
  '/auth/signup',
  [
    body('name').trim().notEmpty().withMessage('name required'),
    body('email').isEmail().withMessage('valid email required'),
    body('password').isLength({ min: 6 }).withMessage('password ≥ 6 chars'),
    body('phone').trim().notEmpty().withMessage('phone required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.length) {
      let { name, email, password, phone } = req.body;
      email = email.toLowerCase();
      const phoneDigits = (phone || '').replace(/\D/g, '');
      try {
        const [e] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
        if (e.length) return res.status(409).json({ error: 'Email already registered' });
        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
          `INSERT INTO users (email, name, phone, password_hash, role, is_active)
           VALUES (?, ?, ?, ?, 'user', 1)`,
          [email, name, phoneDigits, password_hash]
        );
        const user = { id: result.insertId, name, email, phone: phoneDigits, role: 'user' };
        const token = signToken(user);
        return res.status(201).json({ user, token });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }
    return res.status(400).json({ error: errors.array()[0].msg });
  }
);

app.post(
  '/auth/login',
  [
    body('identifier').trim().notEmpty().withMessage('email or phone required'),
    body('password').notEmpty().withMessage('password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.length) {
      const { identifier, password } = req.body;
      try {
        const user = await findUserByEmailOrPhone(identifier);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        if (!user.is_active) return res.status(403).json({ error: 'Account disabled' });
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
        await pool.query('UPDATE users SET last_login = NOW() WHERE id=?', [user.id]);
        const token = signToken(user);
        return res.json({
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
          token,
        });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }
    return res.status(400).json({ error: errors.array()[0].msg });
  }
);

app.get('/auth/me', auth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id=?',
    [req.user.id]
  );
  res.json(rows[0] || null);
});

/* ---------- Rides (kept) ---------- */
const VEHICLES = new Set(['BIKE','CNG','SEDAN','SUV','TRANSIT','WALK']);

app.post('/rides', auth, async (req, res) => {
  try {
    const { pickup, dropoff, vehicle_type, distance_km, duration_min, price } = req.body;
    if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
      return res.status(400).json({ error: 'pickup/dropoff lat,lng required' });
    }
    const vt = String(vehicle_type || '').toUpperCase();
    if (!VEHICLES.has(vt)) return res.status(400).json({ error: 'invalid vehicle_type' });

    const dist = Number(distance_km);
    const dur  = Math.round(Number(duration_min));
    const fare = Math.round(Number(price));
    if (isNaN(dist) || isNaN(dur) || isNaN(fare)) {
      return res.status(400).json({ error: 'distance_km, duration_min, price must be numbers' });
    }

    const sql = `
      INSERT INTO rides (
        rider_id, vehicle_type,
        pickup_lat, pickup_lng, pickup_name,
        dropoff_lat, dropoff_lng, dropoff_name,
        distance_km, duration_min, price, status
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?, 'requested')
    `;
    const params = [
      req.user.id, vt,
      pickup.lat, pickup.lng, pickup.name || null,
      dropoff.lat, dropoff.lng, dropoff.name || null,
      dist, dur, fare
    ];

    const [result] = await pool.query(sql, params);
    res.status(201).json({
      id: result.insertId,
      status: 'requested',
      vehicle_type: vt,
      distance_km: dist,
      duration_min: dur,
      price: fare,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/rides/me', auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, vehicle_type, pickup_name, dropoff_name, distance_km, duration_min, price, status, created_at
     FROM rides WHERE rider_id=? ORDER BY id DESC LIMIT 50`,
    [req.user.id]
  );
  res.json(rows);
});

/* ---------- Shipments (FIXED) ---------- */
// Create shipment (uses JWT's user id or rider_id from body)
/* ---------------- Shipments (FIXED) — matches your table with rider_id ---------------- */
/**
 * Create a package shipment.
 * Uses JWT (Authorization Bearer) if present; otherwise accepts rider_id in body.
 */
/* ---------------- Shipments (FIXED & COMPATIBLE) ---------------- */
/**
 * Create a package shipment.
 * Uses JWT (Authorization Bearer) if present; otherwise accepts rider_id in body.
 */
app.post('/shipments', softAuth, async (req, res) => {
  try {
    // Debug log — helps confirm what’s arriving
    console.log('[POST /shipments] user:', req.user?.id, 'body:', req.body);

    const {
      pickup_address, pickup_lat = null, pickup_lng = null,
      drop_address,   drop_lat   = null, drop_lng   = null,
      slot_text,
      mode = 'send', size = 'M', qty = 1,
      notes = '', est_fare = 0
    } = req.body || {};

    // Get rider from JWT or fallback to body.rider_id (no illegal ??/|| mixing)
    const riderIdFromBody = req.body?.rider_id;
    const ownerId = (req.user?.id != null)
      ? req.user.id
      : (riderIdFromBody != null ? Number(riderIdFromBody) : null);

    if (!ownerId) {
      return res.status(401).json({ error: 'rider_id or login token required' });
    }

    if (!pickup_address || !drop_address || !slot_text) {
      return res.status(400).json({ error: 'pickup_address, drop_address, slot_text required' });
    }

    // Ensure user exists (avoid FK issues)
    const [u] = await pool.query('SELECT id FROM users WHERE id=? LIMIT 1', [ownerId]);
    if (!u.length) return res.status(400).json({ error: 'rider_id not found in users' });

    // Insert (keep order aligned with your table schema)
    const sql = `
      INSERT INTO shipments (
        rider_id,
        pickup_address, pickup_lat, pickup_lng,
        drop_address,   drop_lat,   drop_lng,
        slot_text, mode, size, qty, notes, est_fare, status
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'requested')
    `;
    const params = [
      ownerId,
      pickup_address, pickup_lat, pickup_lng,
      drop_address,   drop_lat,   drop_lng,
      slot_text, mode, size, Number(qty) || 1, notes || null, Number(est_fare) || 0
    ];

    const [result] = await pool.query(sql, params);
    return res.status(201).json({ id: result.insertId, status: 'requested' });
  } catch (e) {
    console.error('[POST /shipments] error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
});



app.get('/shipments/:id', softAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM shipments WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const row = rows[0];
  if (req.user && row.rider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  res.json(row);
});

app.patch('/shipments/:id/status', softAuth, async (req, res) => {
  const { status } = req.body;
  const [rows] = await pool.query('SELECT rider_id FROM shipments WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  if (req.user && rows[0].rider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  await pool.query('UPDATE shipments SET status=?, updated_at=NOW() WHERE id=?', [status, req.params.id]);
  res.json({ ok: true });
});

app.post('/shipments/:id/locations', async (req, res) => {
  const { lat, lng, heading = 0, speed = 0 } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat/lng required as numbers' });
  }
  await pool.query(
    'INSERT INTO courier_locations (shipment_id, courier_id, lat, lng, heading, speed) VALUES (?,?,?,?,?,?)',
    [req.params.id, null, lat, lng, heading, speed]
  );
  res.status(201).json({ ok: true });
});

app.get('/shipments/me', auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, pickup_address, drop_address, slot_text, size, qty, status, created_at
     FROM shipments WHERE rider_id=? ORDER BY id DESC LIMIT 100`,
    [req.user.id]
  );
  res.json(rows);
});

/* ---------- Dashboards ---------- */
app.get('/dashboard/summary', auth, async (req, res) => {
  try {
    const period = (req.query.period || '30d').toLowerCase();
    const now = new Date();
    let start;
    if (period === 'ytd') start = new Date(now.getFullYear(), 0, 1);
    else { const days = period === '7d' ? 7 : period === '90d' ? 90 : 30; start = new Date(now.getTime() - days*24*3600*1000); }
    const startStr = new Date(start.getTime() - start.getTimezoneOffset()*60000).toISOString().slice(0,19).replace('T',' ');

    const [spendRows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%b') AS label, SUM(price) AS value
       FROM rides WHERE rider_id=? AND created_at>=? GROUP BY YEAR(created_at), MONTH(created_at)
       ORDER BY YEAR(created_at), MONTH(created_at)`,
      [req.user.id, startStr]
    );
    const [vehRows] = await pool.query(
      `SELECT vehicle_type, COUNT(*) AS cnt
       FROM rides WHERE rider_id=? AND created_at>=? GROUP BY vehicle_type`,
      [req.user.id, startStr]
    );
    const byVehicle = {};
    for (const r of vehRows) byVehicle[r.vehicle_type] = Number(r.cnt);
    const [[tot]] = await pool.query(
      `SELECT COUNT(*) AS total FROM rides WHERE rider_id=? AND created_at>=?`,
      [req.user.id, startStr]
    );
    res.json({
      period,
      totalRides: Number(tot.total),
      monthlySpend: spendRows.map(r => ({ month: r.label, value: Number(r.value) })),
      byVehicle
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/dashboard/package', auth, async (req, res) => {
  try {
    const period = (req.query.period || '30d').toLowerCase();
    const now = new Date();
    let start;
    if (period === 'ytd') start = new Date(now.getFullYear(), 0, 1);
    else { const days = period === '7d' ? 7 : period === '90d' ? 90 : 30; start = new Date(now.getTime() - days*24*3600*1000); }
    const startStr = new Date(start.getTime() - start.getTimezoneOffset()*60000).toISOString().slice(0,19).replace('T',' ');

    const [feeRows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%b') AS label, AVG(est_fare) AS avg_fee
       FROM shipments WHERE rider_id=? AND created_at>=?
       GROUP BY YEAR(created_at), MONTH(created_at)
       ORDER BY YEAR(created_at), MONTH(created_at)`,
      [req.user.id, startStr]
    );

    const [sizeRows] = await pool.query(
      `SELECT size, SUM(qty) AS cnt
       FROM shipments WHERE rider_id=? AND created_at>=? GROUP BY size`,
      [req.user.id, startStr]
    );
    const bySize = {};
    for (const r of sizeRows) {
      const key = r.size === 'S' ? 'Small' : r.size === 'M' ? 'Medium' : r.size === 'L' ? 'Large' : String(r.size || 'Other');
      bySize[key] = Number(r.cnt);
    }

    const [[tot]] = await pool.query(
      `SELECT IFNULL(SUM(qty),0) AS total FROM shipments WHERE rider_id=? AND created_at>=?`,
      [req.user.id, startStr]
    );
    const [[delivered]] = await pool.query(
      `SELECT IFNULL(SUM(qty),0) AS delivered
       FROM shipments WHERE rider_id=? AND created_at>=? AND status IN ('arrived','delivered','completed')`,
      [req.user.id, startStr]
    );

    res.json({
      period,
      totalPackages: Number(tot.total),
      onTimeRate: Number(tot.total) ? Math.round((Number(delivered.delivered) / Number(tot.total)) * 100) : 0,
      monthlyFees: feeRows.map(r => ({ month: r.label, value: Math.round(Number(r.avg_fee) || 0) })),
      bySize
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---------- Tickets (NEW) ---------- */

/**
 * Create a ticket (PENDING).
 * Body: {
 *   mode: 'bus'|'train'|'hotel'|'ferry'|'plane',
 *   travel: { from, to, date: 'YYYY-MM-DD', dep_time, arr_time },
 *   service: { service_id, operator, type },
 *   seats: ['3A','3B'],
 *   pricing: { perSeat, subtotal, currency },
 *   passenger: { name, phone, email }
 * }
 * Returns: { ticket_id, pnr, status }
 */
/* ---------- Tickets (dual paths: with and without /api) ---------- */

// helper so a handler can serve both '/x' and '/api/x'
const withApi = (p) => [p, `/api${p}`];

/** Create ticket (PENDING) */
app.post(withApi('/tickets'), auth, async (req, res) => {
  try {
    console.log('[POST /tickets] user:', req.user?.id, 'body:', JSON.stringify(req.body));
    const riderId = req.user.id;
    await ensureRiderRow(riderId);

    const { mode, travel = {}, service = {}, seats = [], pricing = {}, passenger = {} } = req.body || {};
    const m = String(mode || '').toLowerCase();
    if (!TICKET_MODES.has(m)) return res.status(400).json({ message: `Invalid mode: ${mode}` });
    if (!travel.from || !travel.to || !travel.date)
      return res.status(400).json({ message: 'travel.from, travel.to and travel.date are required' });

    const seatList = Array.from(new Set((seats || []).map(s => String(s).trim()).filter(Boolean)));
    const seatCount = seatList.length;
    const pnr = genPNR(6);

    const sql = `
      INSERT INTO tickets (
        rider_id, mode, from_city, to_city, travel_date, dep_time, arr_time,
        service_id, operator_name, class_or_type,
        price_per_seat, seat_count, subtotal, total, currency, pnr, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?, 'PENDING')
    `;
    const params = [
      riderId, m, travel.from, travel.to, travel.date, travel.dep_time || null, travel.arr_time || null,
      service.service_id || null, service.operator || null, service.type || null,
      Number(pricing.perSeat || 0), seatCount, Number(pricing.subtotal || 0),
      (pricing.currency || 'BDT'), pnr
    ];
    const [result] = await pool.query(sql, params);
    const ticketId = result.insertId;

    if (seatCount) {
      const placeholders = seatList.map(() => '(?, ?)').join(',');
      const flat = seatList.flatMap(code => [ticketId, code]);
      await pool.query(`INSERT INTO ticket_seats (ticket_id, seat_code) VALUES ${placeholders}`, flat);
    }

    if (passenger && (passenger.name || passenger.phone || passenger.email)) {
      await pool.query(
        'INSERT INTO ticket_passengers (ticket_id, name, phone, email) VALUES (?,?,?,?)',
        [ticketId, passenger.name || null, passenger.phone || null, passenger.email || null]
      );
    }

    return res.status(201).json({ ticket_id: ticketId, pnr, status: 'PENDING' });
  } catch (e) {
    console.error('[POST /tickets] error:', e?.sqlMessage || e?.message, e?.code || '');
    return res.status(500).json({ message: e?.sqlMessage || e?.message || 'Server error' });
  }
});

/** Pay for a ticket → PAID */
app.patch(withApi('/tickets/:id/pay'), auth, async (req, res) => {
  try {
    const riderId = req.user.id;
    const ticketId = Number(req.params.id);
    const { method, amount, currency = 'BDT', txn_ref = null } = req.body || {};
    if (!method || isNaN(Number(amount))) return res.status(400).json({ message: 'method and numeric amount required' });

    const [[t]] = await pool.query('SELECT ticket_id, rider_id, pnr FROM tickets WHERE ticket_id=? LIMIT 1', [ticketId]);
    if (!t) return res.status(404).json({ message: 'Ticket not found' });
    if (t.rider_id !== riderId) return res.status(403).json({ message: 'Forbidden' });

    await pool.query('INSERT INTO payments (ticket_id, method, amount, currency, txn_ref) VALUES (?,?,?,?,?)',
      [ticketId, method, Number(amount), currency, txn_ref]);
    await pool.query('UPDATE tickets SET status="PAID", total=? WHERE ticket_id=?', [Number(amount), ticketId]);

    return res.json({ ticket_id: ticketId, pnr: t.pnr, status: 'PAID' });
  } catch (e) {
    console.error('[PATCH /tickets/:id/pay] error:', e?.sqlMessage || e?.message, e?.code || '');
    return res.status(500).json({ message: e?.sqlMessage || e?.message || 'Server error' });
  }
});

/** Dashboard */
app.get(withApi('/dashboard/ticket'), auth, async (req, res) => {
  try {
    const riderId = req.user.id;
    const period = String(req.query.period || '30d').toLowerCase();
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === 'ytd' ? 365 : 30;

    const [sumRows] = await pool.query(
      `SELECT mode, COUNT(*) AS c
         FROM tickets
        WHERE rider_id=? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY mode`, [riderId, days]
    );
    const byMode = {};
    for (const r of sumRows) byMode[(r.mode||'').replace(/^\w/, m=>m.toUpperCase())] = Number(r.c);

    const [spend] = await pool.query(
      `SELECT DATE_FORMAT(created_at,'%b') AS month, COALESCE(SUM(total),0) AS value
         FROM tickets
        WHERE rider_id=? AND status='PAID' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at,'%Y-%m')
        ORDER BY MIN(created_at)`, [riderId]
    );

    const [recent] = await pool.query(
      `SELECT t.ticket_id, t.pnr, t.mode,
              t.from_city AS \`from\`, t.to_city AS \`to\`,
              t.travel_date, t.dep_time, t.arr_time, t.total, t.status,
              GROUP_CONCAT(s.seat_code ORDER BY s.seat_code) AS seats_csv
         FROM tickets t
    LEFT JOIN ticket_seats s ON s.ticket_id=t.ticket_id
        WHERE t.rider_id=?
        GROUP BY t.ticket_id
        ORDER BY t.created_at DESC
        LIMIT 10`, [riderId]
    );
    res.json({
      totalTickets: sumRows.reduce((a,b)=>a+Number(b.c||0),0),
      byMode,
      monthlySpend: spend.map(x => ({ month: x.month, value: Number(x.value) })),
      recent: recent.map(r => ({ ...r, seats: r.seats_csv ? r.seats_csv.split(',') : [] }))
    });
  } catch (e) {
    console.error('[GET /dashboard/ticket] error:', e?.message);
    res.status(500).json({ message: e?.message || 'Server error' });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => console.log(`API running on 0.0.0.0:${port}`));
