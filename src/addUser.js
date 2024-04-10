const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({
    user: 'user', // Tu usuario de PostgreSQL
    host: 'db', // O 'db' si usas el nombre del servicio en docker-compose
    database: 'whatsappdb', // El nombre de tu base de datos
    password: 'password', // Tu contraseña de PostgreSQL
    port: 5432, // O el puerto que configuraste en docker-compose
});

const addUser = async (username, password) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    try {
        const res = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
        console.log(`Usuario agregado: ${username}`);
    } catch (err) {
        console.error(err.message);
    }

    // Cerrar la conexión de la pool si ya no se va a usar más.
    pool.end();
};

const main = () => {
    const args = process.argv.slice(2);
    if (args.length !== 2) {
        console.log('Uso: node addUser.js <username> <password>');
        process.exit(1);
    }

    const [username, password] = args;
    addUser(username, password);
};

main();
