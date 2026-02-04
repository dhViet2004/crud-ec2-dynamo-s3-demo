const CategoryService = require('../services/CategoryService');

/**
 * Danh sách danh mục
 */
async function listCategories(req, res) {
  try {
    const categories = await CategoryService.getAllCategories();
    res.render('categories/list', {
      categories,
      message: req.query.message || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('listCategories error:', err);
    res.status(500).render('categories/list', {
      categories: [],
      message: null,
      error: 'Could not load categories'
    });
  }
}

/**
 * Hiển thị form thêm danh mục
 */
function showAddForm(req, res) {
  res.render('categories/add', { error: null });
}

/**
 * Tạo danh mục
 */
async function createCategory(req, res) {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.render('categories/add', { error: 'Category name is required' });
    }

    await CategoryService.createCategory({ name, description });

    res.redirect('/categories?message=' + encodeURIComponent('Category created successfully'));
  } catch (err) {
    console.error('createCategory error:', err);
    res.render('categories/add', { error: err.message });
  }
}

/**
 * Hiển thị form chỉnh sửa danh mục
 */
async function showEditForm(req, res) {
  try {
    const { id } = req.params;
    const category = await CategoryService.getCategoryById(id);

    if (!category) {
      return res.redirect('/categories?error=' + encodeURIComponent('Category not found'));
    }

    res.render('categories/edit', { category, error: null });
  } catch (err) {
    console.error('showEditForm error:', err);
    res.redirect('/categories?error=' + encodeURIComponent('Could not load category'));
  }
}

/**
 * Cập nhật danh mục
 */
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    await CategoryService.updateCategory(id, { name, description });

    res.redirect('/categories?message=' + encodeURIComponent('Category updated successfully'));
  } catch (err) {
    console.error('updateCategory error:', err);
    const category = await CategoryService.getCategoryById(id);
    res.render('categories/edit', { category, error: err.message });
  }
}

/**
 * Xóa danh mục
 */
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    await CategoryService.deleteCategory(id);

    res.redirect('/categories?message=' + encodeURIComponent('Category deleted successfully'));
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.redirect('/categories?error=' + encodeURIComponent(err.message));
  }
}

module.exports = {
  listCategories,
  showAddForm,
  createCategory,
  showEditForm,
  updateCategory,
  deleteCategory
};
