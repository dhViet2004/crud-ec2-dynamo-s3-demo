require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const productsRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const { attachUser } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true nếu sử dụng HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware gắn user vào locals
app.use(attachUser);

// Routes
app.use('/auth', authRoutes);
app.use('/categories', categoriesRoutes);
app.use('/', productsRoutes);

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render('error', {
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
