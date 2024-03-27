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

