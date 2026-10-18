const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lost_and_found',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true
    });

    // Fail fast if MySQL is unreachable
    pool.query('SELECT 1')
      .then(() => console.log('✅ MySQL connected'))
      .catch(err => console.error('❌ MySQL connection failed:', err.message));
  }
  return pool;
}

module.exports = { getPool };