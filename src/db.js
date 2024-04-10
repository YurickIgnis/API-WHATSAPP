const { Pool } = require('pg');

const pool = new Pool({
    user: 'user',
    host: 'db',
    database: 'whatsappdb',
    password: 'password',
    port: 5432,
});

module.exports = { pool };
