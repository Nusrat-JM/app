require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3308,
    });
    const [rows] = await conn.query('SELECT 1 AS ok');
    console.log('DB OK:', rows);
    await conn.end();
  } catch (e) {
    console.error('DB ERROR:', e.message);
  }
})();
