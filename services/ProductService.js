const ProductRepository = require('../repositories/ProductRepository');
const ProductLogRepository = require('../repositories/ProductLogRepository');
const CategoryRepository = require('../repositories/CategoryRepository');

class ProductService {
  /**
   * Lấy tất cả sản phẩm với lọc
   */
  async getAllProducts(filters = {}) {
    try {
      let products = await ProductRepository.getAll();

      // Lọc theo category
      if (filters.categoryId) {
        products = products.filter(p => p.categoryId === filters.categoryId);
      }

      // Lọc theo khoảng giá
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const minPrice = filters.minPrice || 0;
        const maxPrice = filters.maxPrice || Infinity;
        products = products.filter(p => p.price >= minPrice && p.price <= maxPrice);
      }

      // Tìm kiếm theo tên
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        products = products.filter(p => p.name.toLowerCase().includes(searchTerm));
      }

      // Sắp xếp
      if (filters.sortBy) {
        products.sort((a, b) => {
          if (filters.sortBy === 'name') {
            return a.name.localeCompare(b.name);
          } else if (filters.sortBy === 'price') {
            return filters.sortOrder === 'desc' ? b.price - a.price : a.price - b.price;
          }
          return 0;
        });
      }

      return products;
    } catch (err) {
      console.error('ProductService.getAllProducts error:', err);
      throw err;
    }
  }

  /**
   * Lấy sản phẩm theo ID
   */
  async getProductById(productId) {
    try {
      return await ProductRepository.getById(productId);
    } catch (err) {
      console.error('ProductService.getProductById error:', err);
      throw err;
    }
  }

  /**
   * Tạo sản phẩm mới
   */
  async createProduct(productData, userId) {
    try {
      // Validate category tồn tại
      if (productData.categoryId) {
        const category = await CategoryRepository.getById(productData.categoryId);
        if (!category) {
          throw new Error('Category not found');
        }
      }

      const product = await ProductRepository.create(productData);
      
      // Ghi log
      await ProductLogRepository.log(product.productId, 'CREATE', userId);

      return product;
    } catch (err) {
      console.error('ProductService.createProduct error:', err);
      throw err;
    }
  }

  /**
   * Cập nhật sản phẩm
   */
  async updateProduct(productId, updates, userId) {
    try {
      const product = await ProductRepository.getById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Validate category nếu cập nhật
      if (updates.categoryId && updates.categoryId !== product.categoryId) {
        const category = await CategoryRepository.getById(updates.categoryId);
        if (!category) {
          throw new Error('Category not found');
        }
      }

      const updated = await ProductRepository.update(productId, updates);
      
      // Ghi log
      await ProductLogRepository.log(productId, 'UPDATE', userId);

      return updated;
    } catch (err) {
      console.error('ProductService.updateProduct error:', err);
      throw err;
    }
  }

  /**
   * Xóa sản phẩm (soft delete)
   */
  async deleteProduct(productId, userId) {
    try {
      const product = await ProductRepository.getById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      await ProductRepository.softDelete(productId);
      
      // Ghi log
      await ProductLogRepository.log(productId, 'DELETE', userId);

      return true;
    } catch (err) {
      console.error('ProductService.deleteProduct error:', err);
      throw err;
    }
  }

  /**
   * Lấy trạng thái tồn kho
   */
  getInventoryStatus(quantity) {
    if (quantity === 0) return 'out-of-stock';
    if (quantity < 5) return 'low-stock';
    return 'in-stock';
  }

  /**
   * Lấy sản phẩm theo category
   */
  async getProductsByCategory(categoryId) {
    try {
      return await ProductRepository.findByCategory(categoryId);
    } catch (err) {
      console.error('ProductService.getProductsByCategory error:', err);
      throw err;
    }
  }

  /**
   * Tìm kiếm sản phẩm
   */
  async searchProducts(searchTerm) {
    try {
      return await ProductRepository.findByName(searchTerm);
    } catch (err) {
      console.error('ProductService.searchProducts error:', err);
      throw err;
    }
  }
}

module.exports = new ProductService();
