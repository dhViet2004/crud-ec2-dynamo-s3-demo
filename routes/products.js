const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  listProducts,
  showAddForm,
  createProduct,
  showEditForm,
  updateProduct,
  deleteProduct
} = require('../controllers/productsController');

router.get('/', listProducts);
router.get('/add', requireAdmin, showAddForm);
router.post('/add', requireAdmin, upload.single('image'), createProduct);
router.get('/edit/:id', requireAdmin, showEditForm);
router.post('/edit/:id', requireAdmin, upload.single('image'), updateProduct);
router.post('/delete/:id', requireAdmin, deleteProduct);

module.exports = router;
