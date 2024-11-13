const express = require('express');
const app = express();
const port = 3000;

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' }
];

app.get('/api/users', (req, res) => {
  console.log(users)
  res.json(users);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}

module.exports = app;
