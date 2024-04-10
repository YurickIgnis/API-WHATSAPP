const express = require('express');
const bodyParser = require('body-parser');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');
const verificarToken = require('./authMiddleware');

const app = express();
const port = 3000;
const PUBLIC_TOKEN = "tuTokenEstaticoSeguro";

app.use(bodyParser.json());

const wwebVersion = '2.2407.3';

const client = new Client({
    authStrategy: new LocalAuth(), // your authstrategy here
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },
});
client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('Cliente de WhatsApp está listo!'));
client.initialize();

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = rows[0];
        if (user && bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.json({ auth: true, token });
        } else {
            res.status(401).send('Login fallido');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
});


app.post('/generate-non-expiring-token', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = rows[0];
        if (user && bcrypt.compareSync(password, user.password)) {
            // Genera un token sin fecha de expiración
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
            res.json({ auth: true, token });
        } else {
            res.status(401).send('Login fallido');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
});

app.post('/send-message', verificarToken, async (req, res) => {
    const { number, message } = req.body;
    let chatId;

    if (number.includes('@g.us')) {
        // Es un ID de grupo, usar directamente
        chatId = number;
    } else {
        // Es un número individual, sanitizar y añadir el código de país y @c.us
        const sanitizedNumber = sanitizeNumber(number);
        const destinatarioFinal = await client.getNumberId(sanitizedNumber);
        if (!destinatarioFinal) {
            return res.status(404).send({ status: 'error', message: 'Número no encontrado.' });
        }
        chatId = destinatarioFinal._serialized;
    }

    try {
        await client.sendMessage(chatId, message);
        res.json({ status: 'success', message: `Mensaje enviado a ${number}` });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al enviar el mensaje');
    }
});


app.post('/send-message-public', async (req, res) => {
    const { number, message, token } = req.body;

    // Verificación básica del token estático
    if (token !== PUBLIC_TOKEN) {
        return res.status(401).send({ status: 'error', message: 'Acceso no autorizado.' });
    }

    let chatId = number.includes('@g.us') ? number : sanitizeNumber(number);

    try {
        const destinatarioFinal = number.includes('@g.us') ? { _serialized: number } : await client.getNumberId(chatId);
        if (!destinatarioFinal) {
            return res.status(404).send({ status: 'error', message: 'Número no encontrado.' });
        }
        await client.sendMessage(destinatarioFinal._serialized, message);
        res.json({ status: 'success', message: `Mensaje enviado a ${number}` });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al enviar el mensaje');
    }
});

function sanitizeNumber(number) {
    const sanitizedNumber = number.toString().replace(/[- )(]/g, "");
    return `52${sanitizedNumber}@c.us`;
}




app.listen(port, () => console.log(`Servidor corriendo en http://localhost:${port}`));
