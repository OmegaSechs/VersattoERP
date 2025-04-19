const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    passworld: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

module.exports = pool;
// This code sets up a connection pool to a PostgreSQL database using the 'pg' library.