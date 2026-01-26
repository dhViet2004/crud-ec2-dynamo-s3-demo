const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const {
  listProducts,
  showAddForm,
  createProduct,
  showEditForm,
  updateProduct,
  deleteProduct
} = require('../controllers/productsController');

router.get('/', listProducts);
router.get('/add', showAddForm);
router.post('/add', upload.single('image'), createProduct);
router.get('/edit/:id', showEditForm);
router.post('/edit/:id', upload.single('image'), updateProduct);
router.post('/delete/:id', deleteProduct);

module.exports = router;
