require('dotenv').config();

const express = require('express');
const path = require('path');
const productsRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', productsRoutes);

app.use((err, req, res, _next) => {
	console.error(err);
	res.status(500).render('list', { products: [], message: null, error: 'Unexpected server error.' });
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
