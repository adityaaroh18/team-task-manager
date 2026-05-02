const { Pool } = require('pg');

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // 🔥 IMPORTANT for Railway (SSL required)
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// ✅ Log successful connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

// ❌ DO NOT crash the app on DB error
pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  // ❌ removed process.exit to prevent Railway crash
});

// 🔥 Optional: test connection at startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('🚀 Database connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

module.exports = pool;