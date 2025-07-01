const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Versatto',
  password: '//Senha utilizada no postgre do usuário', 
  port: 5432,
});

module.exports = pool;