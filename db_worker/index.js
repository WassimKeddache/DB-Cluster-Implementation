const express = require('express');
const mysql = require('mysql');

// Create the Express app
const app = express();
const port = 8080;

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sakila'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
});

app.get('/actors', (req, res) => {
  connection.query('SELECT * FROM actor LIMIT 10;', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error querying the database' });
      return;
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});