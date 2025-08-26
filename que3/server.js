const express = require('express');
const session = require('express-session');
const Redis = require('ioredis'); // Use ioredis for better compatibility
const RedisStore = require('connect-redis')(session); // ✅ Correct usage
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const redisClient = new Redis(); // Automatically connects to localhost:6379

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, maxAge: 60000 }
    })
);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === '1234') {
        req.session.user = username;
        return res.redirect('/dashboard');
    }

    res.send('Invalid credentials. <a href="/">Try again</a>');
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    res.send(`Welcome ${req.session.user}! <a href="/logout">Logout</a>`);
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});