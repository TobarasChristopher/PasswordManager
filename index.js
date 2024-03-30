const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Added a content security policy with the help of the helmet module
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  }
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
//added "required" parameter as to require both username and password to be a value instead of null
app.get('/login', (req, res) => {
  res.send(`
    <h2>Login Page</h2>
    <form action="/login" method="post">
      <div>
        <label for="username">Username:</label>

        <input type="text" id="username" name="username" required>
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
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

  //replaced unsanitized inputs with placeholders such as "?"
  const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  //replaced error page with a generic error hiding information
  db.get(sql, [username, password], (err, row) => {
      if (err) {
        req.session.error = 'An error occurred while logging in.';
        return res.redirect('/login'); // Redirect to the login page
      }

    if (row) {
      req.session.username = username;
      res.redirect('/account');
    } else {
        req.session.error = 'Invalid username or password.';
        return res.redirect('/login'); // Redirect to the login page
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
      <p>Its a wonderful day!</p>
      <p><a href="/logout">Logout</a></p>
    `);
  });
});
//added "required" parameter as to require both username and password to be a value instead of null
app.get('/register', (req, res) => {
  res.send(`
    <h2>Registration Page</h2>
    <form action="/register" method="post">
      <div>
        <label for="username">Username:</label>

        <input type="text" id="username" name="username" required>
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
      </div>
      <button type="submit">Register</button>
    </form>
    <p>Already have an account? <a href="/login">Login</a></p>
  `);
});

app.post('/register', (req, res) => {
  let { username, password } = req.body;

  // Check if username or password is empty
  if (!username || !password) {
    req.session.error = 'Username and password are required.';
    return res.redirect('/register');
  }


  // Prepare the SQL statement with placeholders
  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";

  // Execute the statement with user input as parameters
  db.run(sql, [username, password], function(err) {
    if (err) {
      req.session.error = 'An error occurred during registration.';
      return res.redirect('/register');
    }

    req.session.username = username;
    res.redirect('/login');
  });
});

app.get('/alert', (req, res) => {
  const error = req.session.error; // Get the error from session
  if (error) {
    // Clear the error from session
    req.session.error = null;
    // Display an alert and refresh the page
    res.send(`<script>alert('${error}'); window.location.href = '/';</script>`);
  } else {
    // If there's no error, redirect to the home page
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
