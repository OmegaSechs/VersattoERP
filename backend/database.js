const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Versatto',
  password: '1704',
  port: 5432,
});

module.exports = pool;