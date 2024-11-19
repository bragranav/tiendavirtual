// Importar módulos necesarios
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3306;

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: true // Cambia a false si el certificado es autofirmado
    },
    connectTimeout: 10000
});

db.connect(err => {
    if (err) throw err;
    console.log('Conectado a la base de datos');
});

// Configuración de middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://sprightly-druid-1fb38a.netlify.app',
            'https://673d17acc1331700099231c0--sprightly-druid-1fb38a.netlify.app'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origen no permitido por CORS'));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

// Rutas estáticas
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views/register.html')));
app.get('/index', (req, res) => {
    if (!req.cookies.username) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Registro de usuarios
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

        db.query(query, [username, email, hashedPassword], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).send('El usuario o el correo ya están registrados.');
                }
                throw err;
            }
            res.status(200).send('Registro exitoso.');
        });
    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).send('Error interno del servidor.');
    }
});

// Inicio de sesión
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send('Faltan campos obligatorios.');
        }

        const query = 'SELECT * FROM users WHERE username = ?';
        db.query(query, [username], async (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
                return res.status(404).send('Usuario no encontrado.');
            }

            const isPasswordValid = await bcrypt.compare(password, results[0].password);
            if (!isPasswordValid) {
                return res.status(400).send('Contraseña incorrecta.');
            }

            res.cookie('username', results[0].username, {
                maxAge: 900000,
                httpOnly: true,
                secure: true,
                sameSite: 'None'
            });
            res.status(200).send('Inicio de sesión exitoso.');
        });
    } catch (err) {
        console.error('Error en inicio de sesión:', err);
        res.status(500).send('Error interno del servidor.');
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error interno del servidor.');
});

// Iniciar el servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));