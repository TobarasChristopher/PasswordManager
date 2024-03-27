const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));

// Dummy user database (for demo purposes)
const users = [];

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h2>Home Page</h2>
    <p>Welcome to our website!</p>
    <p><a href="/login">Login</a></p>
  `);
});

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
    <script>
          const queryString = window.location.search;
          if (queryString.includes('userNotFound=true')) {
            alert('User not found. Please register.');
            window.location.href = '/register';
          }
          if (queryString.includes('InvalidPassword=true')) {
                          alert('Wrong Password!');
                          window.location.href = '/login';
          }
    </script>
  `);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(user => user.username === username);
  if (!user) {
    return res.redirect('/login?userNotFound=true');
  }

  // Check password
  if (user.password !== password) {
    return res.redirect('/login?InvalidPassword=true');
  }

  res.send('Login successful');
});

// Dummy registration route (for demo purposes)
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
    <script>
              const queryString = window.location.search;
              if (queryString.includes('userAlreadyExists=true')) {
                alert('User already exists! Use the login page');
                window.location.href = '/login';
              }
    </script>
  `);
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Check if user already exists
  if (users.find(user => user.username === username)) {
    return res.redirect('/register?userAlreadyExists=true');
  }

  // Store user in dummy database (plain text password, not recommended)
  users.push({ username, password });

  res.send('Registration successful');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
