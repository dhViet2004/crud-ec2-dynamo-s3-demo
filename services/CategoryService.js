const CategoryRepository = require('../repositories/CategoryRepository');
const ProductRepository = require('../repositories/ProductRepository');

class CategoryService {
  /**
   * Lấy tất cả danh mục
   */
  async getAllCategories() {
    try {
      return await CategoryRepository.getAll();
    } catch (err) {
      console.error('CategoryService.getAllCategories error:', err);
      throw err;
    }
  }

  /**
   * Lấy danh mục theo ID
   */
  async getCategoryById(categoryId) {
    try {
      return await CategoryRepository.getById(categoryId);
    } catch (err) {
      console.error('CategoryService.getCategoryById error:', err);
      throw err;
    }
  }

  /**
   * Tạo danh mục mới
   */
  async createCategory(categoryData) {
    try {
      if (!categoryData.name || categoryData.name.trim().length === 0) {
        throw new Error('Category name is required');
      }

      return await CategoryRepository.create(categoryData);
    } catch (err) {
      console.error('CategoryService.createCategory error:', err);
      throw err;
    }
  }

  /**
   * Cập nhật danh mục
   */
  async updateCategory(categoryId, updates) {
    try {
      const category = await CategoryRepository.getById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      if (updates.name && updates.name.trim().length === 0) {
        throw new Error('Category name is required');
      }

      return await CategoryRepository.update(categoryId, updates);
    } catch (err) {
      console.error('CategoryService.updateCategory error:', err);
      throw err;
    }
  }

  /**
   * Xóa danh mục
   * Business rule: Không xóa nếu có sản phẩm liên quan
   */
  async deleteCategory(categoryId) {
    try {
      const category = await CategoryRepository.getById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Kiểm tra có sản phẩm liên quan
      const products = await ProductRepository.findByCategory(categoryId);
      if (products && products.length > 0) {
        throw new Error(`Cannot delete category with ${products.length} products`);
      }

      return await CategoryRepository.delete(categoryId);
    } catch (err) {
      console.error('CategoryService.deleteCategory error:', err);
      throw err;
    }
  }
}

module.exports = new CategoryService();
