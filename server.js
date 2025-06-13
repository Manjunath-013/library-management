const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Manju1302#',
    database: 'library'
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected');
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) throw err;
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        res.json({ role: user.role, userId: user.id });
    });
});


// Register
app.post('/api/register', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
        [username, hashedPassword, role || 'user'], 
        (err) => {
            if (err) return res.status(500).json({ message: 'Error registering user' });
            res.json({ message: 'User registered' });
        }
    );
});


// Get All Books
app.get('/api/books', (req, res) => {
    db.query('SELECT * FROM books', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Search Books
app.get('/api/search', (req, res) => {
    const query = req.query.q;
    db.query(
        `SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ?`,
        [`%${query}%`, `%${query}%`, `%${query}%`],
        (err, results) => {
            if (err) throw err;
            res.json(results);
        }
    );
});

// Get user transactions
app.get('/api/transactions/:user', (req, res) => {
    const user = req.params.user;
    db.query(
        `SELECT t.*, b.title, b.author FROM transactions t
         JOIN books b ON t.book_id = b.id
         WHERE t.user = ?
         ORDER BY t.timestamp DESC`,
        [user],
        (err, results) => {
            if (err) throw err;
            res.json(results);
        }
    );
});

// Borrow Book
app.post('/api/borrow/:id', (req, res) => {
    const bookId = req.params.id;
    const user = req.body.user || "Guest";
    const paymentMethod = req.body.paymentMethod || null;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    db.query('UPDATE books SET available = false WHERE id = ?', [bookId], (err) => {
        if (err) throw err;
        db.query(
            'INSERT INTO transactions (user, book_id, action, due_date, payment_method) VALUES (?, ?, "borrow", ?, ?)',
            [user, bookId, dueDate, paymentMethod],
            (err) => {
                if (err) throw err;
                res.sendStatus(200);
            }
        );
    });
});


// Return Book
app.post('/api/return/:id', (req, res) => {
    const bookId = req.params.id;
    const user = req.body.user || "Guest";
    const returnDate = new Date();

    db.query('UPDATE books SET available = true WHERE id = ?', [bookId], (err) => {
        if (err) throw err;
        db.query(
            `UPDATE transactions
             SET action = "return", return_date = ?
             WHERE user = ? AND book_id = ? AND action = "borrow"
             ORDER BY timestamp DESC LIMIT 1`,
            [returnDate, user, bookId],
            (err) => {
                if (err) throw err;
                res.sendStatus(200);
            }
        );
    });
});

// Admin: Add Book
app.post('/api/books', (req, res) => {
    const { title, author, isbn } = req.body;
    db.query('INSERT INTO books (title, author, isbn) VALUES (?, ?, ?)', 
        [title, author, isbn], (err) => {
            if (err) throw err;
            res.json({ message: 'Book added' });
        });
});

// Admin: Delete Book
app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM books WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Book deleted' });
    });
});

app.listen(port, () => console.log(`Server running on port ${port}`));

const { Parser } = require('json2csv'); // Add to top: npm install json2csv

// Export books to CSV
app.get('/api/export/books', (req, res) => {
    db.query('SELECT * FROM books', (err, results) => {
        if (err) return res.sendStatus(500);
        const parser = new Parser();
        const csv = parser.parse(results);
        res.header('Content-Type', 'text/csv');
        res.attachment('books.csv');
        res.send(csv);
    });
});

// Export transactions to CSV
app.get('/api/export/transactions', (req, res) => {
    db.query(`
        SELECT t.user, b.title, b.author, t.action, t.due_date, t.return_date, t.timestamp 
        FROM transactions t 
        JOIN books b ON t.book_id = b.id
    `, (err, results) => {
        if (err) return res.sendStatus(500);
        const parser = new Parser();
        const csv = parser.parse(results);
        res.header('Content-Type', 'text/csv');
        res.attachment('transactions.csv');
        res.send(csv);
    });
});

// Admin dashboard stats
app.get('/api/stats', (req, res) => {
    const stats = {};
    db.query('SELECT COUNT(*) AS total FROM books', (err, result1) => {
        stats.totalBooks = result1[0].total;
        db.query('SELECT COUNT(*) AS available FROM books WHERE available = true', (err, result2) => {
            stats.availableBooks = result2[0].available;
            db.query('SELECT COUNT(*) AS borrowed FROM books WHERE available = false', (err, result3) => {
                stats.borrowedBooks = result3[0].borrowed;
                db.query('SELECT COUNT(*) AS users FROM users', (err, result4) => {
                    stats.totalUsers = result4[0].users;
                    res.json(stats);
                });
            });
        });
    });
});

