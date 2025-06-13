function isAdmin() {
    const role = localStorage.getItem("role");
    return role === "admin";
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            alert(data.message);          // still “Invalid credentials” if wrong
        } else {
            localStorage.setItem('libraryUser', username);
localStorage.setItem('role', data.role);

            window.location.href =
                data.role === 'admin' ? 'admin.html' : 'dashboard.html';
        }
    });
}


function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        showLogin();
    });
}

function showRegister() {
    document.querySelector('.login-form').style.display = 'none';
    document.querySelector('.register-form').style.display = 'block';
}

function showLogin() {
    document.querySelector('.register-form').style.display = 'none';
    document.querySelector('.login-form').style.display = 'block';
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

function getUser() {
    return localStorage.getItem("libraryUser") || "Guest";
}

function setUser() {
    const username = document.getElementById("username").value.trim();
    if (username) {
        localStorage.setItem("libraryUser", username);
        document.getElementById("login-box").style.display = "none";
        document.getElementById("welcome").innerText = `Welcome, ${username}`;
    }
}

window.onload = () => {
    const user = getUser();
    if (user && user !== "Guest") {
        const loginBox = document.getElementById("login-box");
        const welcome = document.getElementById("welcome");
        if (loginBox) loginBox.style.display = "none";
        if (welcome) welcome.innerText = `Welcome, ${user}`;
    }

    if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('admin.html')) {
        loadBooks();
    }
};

function loadBooks() {
    fetch('/api/books')
        .then(res => res.json())
        .then(books => renderBooks(books));
}

function renderBooks(books) {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = '';
    books.forEach(book => {
        const div = document.createElement('div');
        div.className = 'book-item';

        let actions = '';

        if (isAdmin()) {
            actions += `<button onclick="deleteBook(${book.id})">Delete</button>`;
            if (!book.available) {
                actions += `<button onclick="returnBook(${book.id})">Return</button>`;
            }
        } else {
            if (book.available) {
                actions += `
                    <button onclick="borrowBook(${book.id})">Borrow</button>
                    <button onclick="addToCart(${book.id})">Add to Cart</button>
                `;
            } else {
                actions += 'Checked Out';
            }
        }

        div.innerHTML = `
            ${book.title} by ${book.author} (ISBN: ${book.isbn})
            ${actions}
        `;
        bookList.appendChild(div);
    });
}


function borrowBook(bookId) {
    fetch(`/api/borrow/${bookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: getUser() })
    })
    .then(() => {
        alert("Book borrowed");
        loadBooks();
    });
}

function returnBook(bookId) {
    fetch(`/api/return/${bookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: getUser() })
    })
    .then(() => {
        alert("Book returned");
        loadBooks();
    });
}

function addBook() {
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const isbn = document.getElementById('isbn').value;
    fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, isbn })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        loadBooks();
    });
}

function deleteBook(bookId) {
    fetch(`/api/books/${bookId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            loadBooks();
        });
}

function searchBooks() {
    const query = document.getElementById('searchInput').value;
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(books => renderBooks(books));
}

function showHistory() {
    const user = getUser();
    fetch(`/api/transactions/${encodeURIComponent(user)}`)
        .then(res => res.json())
        .then(transactions => {
            const historyDiv = document.getElementById('history');
            historyDiv.innerHTML = `<h3>Transaction History for ${user}</h3>`;
            if (transactions.length === 0) {
                historyDiv.innerHTML += `<p>No history yet.</p>`;
                return;
            }

            const table = document.createElement('table');
            table.className = 'history-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Book</th>
                        <th>Author</th>
                        <th>Action</th>
                        <th>Due Date</th>
                        <th>Returned</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => {
                        const isOverdue = t.action === 'borrow' && t.due_date && new Date(t.due_date) < new Date();
                        return `
                            <tr ${isOverdue ? 'style="color: red;"' : ''}>
                                <td>${t.title}</td>
                                <td>${t.author}</td>
                                <td><b>${t.action.toUpperCase()}</b></td>
                                <td>${t.due_date || '-'}</td>
                                <td>${t.return_date || '-'}</td>
                                <td>${new Date(t.timestamp).toLocaleString()}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
            historyDiv.appendChild(table);
        });
}


function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
}

function exportCSV(type) {
    const url = `/api/export/${type}`;
    window.open(url, "_blank");
}

function loadStats() {
    fetch('/api/stats')
        .then(res => res.json())
        .then(stats => {
            const statsDiv = document.getElementById("stats");
            statsDiv.innerHTML = `
                <p>Total Books: ${stats.totalBooks}</p>
                <p>Available Books: ${stats.availableBooks}</p>
                <p>Borrowed Books: ${stats.borrowedBooks}</p>
                <p>Total Users: ${stats.totalUsers}</p>
            `;
        });
}

if (window.location.pathname.includes('admin.html')) {
    window.onload = () => {
        loadBooks();
        loadStats();
        const theme = localStorage.getItem("theme");
        if (theme === "dark") document.body.classList.add("dark-mode");
    };
}

function addToCart(id, title, author) {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({ id, title, author });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${title} added to cart!`);
}

function goToCart() {
    window.location.href = "cart.html";

    function checkout(paymentMethod) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const user = getUser();
    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    Promise.all(cart.map(book =>
        fetch('/api/borrow/' + book.id, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, paymentMethod })
        })
    )).then(() => {
        localStorage.removeItem('cart');
        window.location.href = 'thankyou.html';
    });
}

}
