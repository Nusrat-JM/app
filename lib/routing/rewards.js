// routes/rewards.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db'); // your MySQL pool/conn

function computeOffer({ trips = 0, totalSpent = 0 }) {
  if (trips >= 20 || totalSpent >= 30000) return { badge: 'PLATINUM', pct: 30 };
  if (trips >= 12 || totalSpent >= 20000) return { badge: 'GOLD', pct: 20 };
  if (trips >= 5  || totalSpent >= 8000 ) return { badge: 'SILVER', pct: 12 };
  return { badge: 'WELCOME', pct: 7 };
}

router.get('/summary/:userId', async (req, res) => {
  const { userId } = req.params;

  const [[rideAgg]] = await db.query(
    `SELECT COUNT(*) trips, COALESCE(SUM(price),0) totalSpent
       FROM rides WHERE rider_id=? AND status IN ('completed','paid','requested')`, [userId]
  );
  const [[acct]] = await db.query(
    `SELECT COALESCE(points,0) points, tier,
            ROUND(COALESCE(co2_saved_g,0)/1000, 2) co2SavedKg
       FROM eco_rewards_accounts WHERE user_id=?`, [userId]
  );

  const offer = computeOffer(rideAgg);

  res.json({
    trips: rideAgg.trips,
    totalSpent: rideAgg.totalSpent,
    points: acct?.points || 0,
    tier: acct?.tier || 'WELCOME',
    co2SavedKg: acct?.co2SavedKg || 0,
    offer, // {badge,pct}
  });
});

router.post('/apply-offer', async (req, res) => {
  const { userId } = req.body;

  // prevent stacking multiple active vouchers
  const [[existing]] = await db.query(
    `SELECT id, code, pct_off, expires_at FROM vouchers
     WHERE user_id=? AND status='ACTIVE' AND expires_at > NOW() LIMIT 1`, [userId]
  );
  if (existing) return res.json({ voucher: existing, reused: true });

  // recompute to decide % off
  const [[agg]] = await db.query(
    `SELECT COUNT(*) trips, COALESCE(SUM(price),0) totalSpent
       FROM rides WHERE rider_id=? AND status IN ('completed','paid','requested')`, [userId]
  );
  const { pct, badge } = computeOffer(agg);

  const code = 'ECO-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const expiresSql = `DATE_ADD(NOW(), INTERVAL 7 DAY)`;

  await db.query(
    `INSERT INTO vouchers(code, user_id, pct_off, expires_at) VALUES (?,?,?, ${expiresSql})`,
    [code, userId, pct]
  );

  const [[voucher]] = await db.query(`SELECT * FROM vouchers WHERE code=?`, [code]);
  res.json({ voucher, badge });
});

module.exports = router;
