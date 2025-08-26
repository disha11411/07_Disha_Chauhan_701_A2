const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const app = express();

app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  store: new FileStore({}),
  secret: 'mysecretkey123',
  resave: false,
  saveUninitialized: false,
}));

// Dummy user
const user = {
  username: 'admin',
  password: 'password123'
};

// Login page
app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.send(`<h2>Welcome, ${req.session.username}!</h2><a href="/logout">Logout</a>`);
  } else {
    res.send(`
      <h2>Login</h2>
      <form method="POST" action="/login">
        <input name="username" placeholder="Username" required /><br/>
        <input type="password" name="password" placeholder="Password" required /><br/>
        <button type="submit">Login</button>
      </form>
    `);
  }
});

// Handle login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === user.username && password === user.password) {
    req.session.loggedIn = true;
    req.session.username = username;
    res.redirect('/');
  } else {
    res.send('Invalid credentials. <a href="/">Try again</a>');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('Error logging out');
    }
    res.redirect('/');
  });
});

// Start server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
