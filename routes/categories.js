const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../middleware/auth');
const {
  listCategories,
  showAddForm,
  createCategory,
  showEditForm,
  updateCategory,
  deleteCategory
} = require('../controllers/categoriesController');

router.get('/', listCategories);
router.get('/add', requireAdmin, showAddForm);
router.post('/add', requireAdmin, createCategory);
router.get('/edit/:id', requireAdmin, showEditForm);
router.post('/edit/:id', requireAdmin, updateCategory);
router.post('/delete/:id', requireAdmin, deleteCategory);

module.exports = router;
