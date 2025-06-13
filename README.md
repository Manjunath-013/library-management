# 📚 Library Management System

A full-featured web-based Library Management System for users and admins. Includes book borrowing, cart checkout, payment simulation, transaction history, and admin dashboard with CSV export support.

---

## 🚀 Features

### 👤 User Features
- 🔐 Login/Register (User or Admin role)
- 🔍 Search books by title, author, or ISBN
- 📚 Borrow books (with due date)
- 🛒 Add books to cart and checkout
- 💳 Simulated payment (UPI or Card)
- 🧾 Transaction history (borrow/return/purchase with payment type)

### 🛠 Admin Features
- ➕ Add/Delete/Return books
- 📊 View dashboard stats (total/borrowed/available books, user count)
- 📤 Export CSV reports (books & transactions)
- 🔄 Return borrowed books manually
- ❌ No cart/purchase options

### 🌙 UI Features
- ✨ Clean, responsive UI
- 🌙 Dark mode toggle
- 🖼️ Hero images and book cover placeholders

---

## 🧰 Tech Stack

| Layer     | Technology                      |
|-----------|----------------------------------|
| Frontend  | HTML, CSS, JavaScript            |
| Backend   | Node.js + Express                |
| Database  | MySQL                            |
| Security  | bcrypt (password hashing)        |

---

## 🛠 Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/Manjunath-013/library-management.git
cd library-management

2. Install Node Modules
npm install

3.Setup Database
CREATE DATABASE IF NOT EXISTS library;
USE library;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user'
);

CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  author VARCHAR(100),
  isbn VARCHAR(13) UNIQUE,
  available BOOLEAN DEFAULT TRUE
);

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user VARCHAR(100),
  book_id INT,
  action ENUM('borrow', 'return'),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATE DEFAULT NULL,
  return_date DATE DEFAULT NULL,
  payment_method VARCHAR(20),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

4. Update DB Credentials
In server.js, update:

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'library'
});

5. Start the Server
node server.js

6. Open in Browser
http://localhost:3000

NOTE:- Change Your PASSWORD in server.js in Backend
