// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Book = require('./models/Book');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from current directory
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB
async function startDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/librarydb';
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}
startDB();

// ------- API Routes --------

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json({ success: true, data: books });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get book by id
app.get('/api/books/:id', async (req, res) => {
  try {
    const b = await Book.findById(req.params.id);
    if (!b) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: b });
  } catch (err) {
    res.status(400).json({ success:false, message: 'Invalid ID' });
  }
});

// Create a book
app.post('/api/books', async (req, res) => {
  try {
    const { title, author, genre, availableCopies, isbn, publishedYear } = req.body;
    if (!title || !author) return res.status(400).json({ success:false, message: 'Title and author required' });

    const book = new Book({
      title,
      author,
      genre,
      availableCopies: availableCopies ? Number(availableCopies) : 1,
      isbn,
      publishedYear: publishedYear ? Number(publishedYear) : undefined
    });

    await book.save();
    res.status(201).json({ success: true, data: book });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, message: 'Server error' });
  }
});

// Update book
app.put('/api/books/:id', async (req, res) => {
  try {
    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success:false, message:'Book not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success:false, message: 'Bad request' });
  }
});

// Delete book
app.delete('/api/books/:id', async (req, res) => {
  try {
    const removed = await Book.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ success:false, message: 'Book not found' });
    res.json({ success: true, data: removed });
  } catch (err) {
    res.status(400).json({ success:false, message: 'Invalid ID' });
  }
});

// Search books (MongoDB text search or regex)
app.get('/api/books/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: [] });

    // If text search available, use it; else fall back to regex
    let results = [];
    try {
      results = await Book.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } })
                        .sort({ score: { $meta: 'textScore' } })
                        .limit(200);
      // If text search yields nothing, try regex fallback
      if (!results || results.length === 0) {
        const rg = new RegExp(q.split(/\s+/).join('|'), 'i');
        results = await Book.find({ $or: [{ title: rg }, { author: rg }, { genre: rg }] }).limit(200);
      }
    } catch (e) {
      // fallback if text search not available
      const rg = new RegExp(q.split(/\s+/).join('|'), 'i');
      results = await Book.find({ $or: [{ title: rg }, { author: rg }, { genre: rg }] }).limit(200);
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, message: 'Server error' });
  }
});

// Fallback to index.html for SPA-ish behavior (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Library API running on port ${PORT}`);
});
