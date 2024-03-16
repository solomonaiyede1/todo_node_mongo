const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const Todo = require('./models/todo');

// Replace with your actual connection string
const mongoURI = 'mongodb://localhost:27017/todo-app';

const app = express();

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Secret for JWT
const secret = 'your_secret_key';

const verifyJWT = (req, res, next) => {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    req.userId = decoded.id;
    next();
  });
};

// Create Todo
app.post('/todos', verifyJWT, async (req, res) => {
  const { title, description } = req.body;
  try {
    const newTodo = new Todo({ title, description, userId: req.userId });
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Read all Todos
app.get('/todos', verifyJWT, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.userId });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Todo
app.put('/todos/:id', verifyJWT, async (req, res) => {
  const { title, description } = req.body;
  const id = req.params.id;
  try {
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { title, description } },
      { new: true }
    );
    if (!updatedTodo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Todo
app.delete('/todos/:id', verifyJWT, async (req, res) => {
  const id = req.params.id;
  try {
    const deletedTodo = await Todo.findOneAndDelete({ _id: id, userId: req.userId });
    if (!deletedTodo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server listening on port ${port}`));

