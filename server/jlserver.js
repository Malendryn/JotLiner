const express = require('express');

const app = express();
const port = 8080;              // You can use any port

app.use(express.json());        // Middleware to parse JSON requests

let items = [                   // Sample data (in a real app, you'd use a database)
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
];


app.get('/items', (req, res) => {       // GET /items (Get all items)
  res.json(items);
});


app.get('/items/:id', (req, res) => {   // GET /items/:id (Get a specific item)
  const item = items.find((i) => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).send('Item not found');
  res.json(item);
});


app.post('/items', (req, res) => {      // POST /items (Create a new item)
  const item = {
    id: items.length + 1,
    name: req.body.name,
  };
  items.push(item);
  res.status(201).json(item); // 201 Created
});


app.put('/items/:id', (req, res) => {   // PUT /items/:id (Update an item)
  const item = items.find((i) => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).send('Item not found');

  item.name = req.body.name;
  res.json(item);
});


app.delete('/items/:id', (req, res) => {    // DELETE /items/:id (Delete an item)
  items = items.filter((i) => i.id !== parseInt(req.params.id));
  res.status(204).send(); // 204 No Content
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});