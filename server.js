require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 3306;
const cors = require('cors');

// Configura CORS para permitir el acceso desde tu frontend en Netlify
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://sprightly-druid-1fb38a.netlify.app',
            'https://673d17acc1331700099231c0--sprightly-druid-1fb38a.netlify.app'
        ];

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Permite el origen
        } else {
            callback(new Error('Origen no permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true // Necesario para cookies
}));

// Conexión a la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: true // Usa false si es un certificado autofirmado
    },
    connectTimeout: 1000000
});

db.connect(err => {
    if (err) throw err;
    console.log('Conectado a la base de datos');
});

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());

// Rutas
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '/views/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '/views/register.html')));
app.get('/index', (req, res) => {
    // Redirige si la cookie de usuario no está presente
    if (!req.cookies.username) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Registro de usuarios
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, hashedPassword], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(400).send('El usuario o el correo ya están registrados.');
            } else {
                res.status(500).send('Error interno del servidor.');
            }
        } else {
            res.status(200).send('Registro exitoso.');
        }
    });
});

// Inicio de sesión
app.post('/login', async (req, res) => {
    console.log('Solicitud de login recibida:', req.body);

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Faltan campos obligatorios.');
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).send('Error interno al consultar la base de datos.');
        }

        if (results.length === 0) {
            return res.status(404).send('Usuario no encontrado.');
        }

        try {
            const isPasswordValid = await bcrypt.compare(password, results[0].password);
            if (!isPasswordValid) {
                return res.status(400).send('Contraseña incorrecta.');
            }

            res.cookie('username', results[0].username, {
                maxAge: 900000,
                httpOnly: true,
                secure: true,
                sameSite: 'None',
            });
            return res.status(200).send('Inicio de sesión exitoso.');
        } catch (error) {
            console.error('Error al comparar contraseñas:', error);
            return res.status(500).send('Error interno al verificar la contraseña.');
        }
    });
});

// Iniciar el servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
