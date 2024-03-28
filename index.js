const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// SQLite database setup
const db = new sqlite3.Database(':memory:');

// Create a vulnerable users table (for demonstration purposes only)
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
  db.run("INSERT INTO users (username, password) VALUES ('admin', 'admin')");
});

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h2>Home Page</h2>
    <p>Welcome to our website!</p>
    ${req.session.username ? `<p><a href="/account">Account</a></p>` : `<p><a href="/login">Login</a></p>`}
  `);
});

app.get('/login', (req, res) => {
  res.send(`
    <h2>Login Page</h2>
    <form action="/login" method="post">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" >
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" >
      </div>
      <button type="submit">Login</button>
    </form>
    <p>Don't have an account? <a href="/register">Register</a></p>
    ${req.session.error ? `<script>alert('${req.session.error}');</script>` : ''}
  `);
  req.session.error = '';
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.get(sql, (err, row) => {
    if (err) {
      res.send(`
          <h2>Invalid Details:</h2>
          <p>${username}</p>
          <p>${password}</p>
          <a href="/login">Retry</a>
        `);
    }

    if (row) {
      req.session.username = username;
      res.redirect('/account');
    } else {
        res.send(`
            <h2>Invalid Details:</h2>
            <p>${username}</p>
            <p>${password}</p>
            <a href="/login">Retry</a>
       `);
      //req.session.error = 'Invalid username or password';
      //res.redirect('/login');
    }
  });
});

app.get('/account', (req, res) => {
  if (!req.session.username) {
    return res.status(401).send('Unauthorized');
  }

  const username = req.session.username;
  const sql = `SELECT * FROM users WHERE username = '${username}'`;

  db.get(sql, (err, row) => {
    if (err) {
      return res.status(500).send('An error occurred.');
    }

    if (!row) {
      return res.status(404).send('User not found.');
    }

    res.send(`
      <h2>Account Page</h2>
      <p>Welcome, ${row.username}!</p>
      <p>Your password: ${row.password}</p>
      <p><a href="/logout">Logout</a></p>
    `);
  });
});

app.get('/register', (req, res) => {
  res.send(`
    <h2>Registration Page</h2>
    <form action="/register" method="post">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" >
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" >
      </div>
      <button type="submit">Register</button>
    </form>
    <p>Already have an account? <a href="/login">Login</a></p>
  `);
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;

  const sql = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;

  db.run(sql, err => {
    if (err) {
      req.session.error = 'An error occurred.';
      return res.redirect('/register');
    }

    req.session.username = username;
    res.redirect('/account');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
