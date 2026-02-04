const { v4: uuidv4 } = require('uuid');
const ProductService = require('../services/ProductService');
const CategoryService = require('../services/CategoryService');
const { uploadToS3, deleteFromS3 } = require('../utils/s3Helper');

async function listProducts(req, res) {
  try {
    const filters = {
      categoryId: req.query.category || null,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : null,
      search: req.query.search || null,
      sortBy: req.query.sortBy || 'name',
      sortOrder: req.query.sortOrder || 'asc'
    };

    // Lọc bỏ null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null) {
        delete filters[key];
      }
    });

    const products = await ProductService.getAllProducts(filters);
    
    // Thêm trạng thái tồn kho cho mỗi sản phẩm
    const productsWithStatus = products.map(p => ({
      ...p,
      inventoryStatus: ProductService.getInventoryStatus(p.quantity)
    }));

    const categories = await CategoryService.getAllCategories();

    res.render('list', {
      products: productsWithStatus,
      categories,
      message: req.query.message || null,
      error: req.query.error || null,
      filters
    });
  } catch (err) {
    console.error('listProducts error:', err);
    res.status(500).render('list', {
      products: [],
      categories: [],
      message: null,
      error: 'Could not load products.',
      filters: {}
    });
  }
}

async function showAddForm(_req, res) {
  try {
    const categories = await CategoryService.getAllCategories();
    res.render('add', { categories, error: null });
  } catch (err) {
    console.error('showAddForm error:', err);
    res.render('add', { categories: [], error: 'Could not load categories' });
  }
}

async function createProduct(req, res) {
  const { name, price, quantity, categoryId } = req.body;
  try {
    if (!name || !price || !quantity) {
      const categories = await CategoryService.getAllCategories();
      return res.status(400).render('add', {
        categories,
        error: 'Please provide name, price, and quantity.'
      });
    }

    if (!req.file) {
      const categories = await CategoryService.getAllCategories();
      return res.status(400).render('add', {
        categories,
        error: 'Please upload a product image.'
      });
    }

    const priceValue = Number(price);
    const quantityValue = Number(quantity);

    if (Number.isNaN(priceValue) || Number.isNaN(quantityValue)) {
      const categories = await CategoryService.getAllCategories();
      return res.status(400).render('add', {
        categories,
        error: 'Price and quantity must be numbers.'
      });
    }

    const { url, key } = await uploadToS3(req.file);

    const product = {
      productId: uuidv4(),
      name: name.trim(),
      price: priceValue,
      quantity: quantityValue,
      categoryId: categoryId || null,
      url_image: url,
      imageKey: key
    };

    await ProductService.createProduct(product, req.session.user.userId);

    res.redirect('/?message=' + encodeURIComponent('Product created'));
  } catch (err) {
    console.error('createProduct error:', err);
    const categories = await CategoryService.getAllCategories();
    res.status(500).render('add', {
      categories,
      error: err.message || 'Could not create product.'
    });
  }
}

async function showEditForm(req, res) {
  const { id } = req.params;
  try {
    const product = await ProductService.getProductById(id);
    if (!product) {
      return res.redirect('/?error=' + encodeURIComponent('Product not found'));
    }

    const categories = await CategoryService.getAllCategories();
    res.render('edit', { product, categories, error: null });
  } catch (err) {
    console.error('showEditForm error:', err);
    res.redirect('/?error=' + encodeURIComponent('Could not load product'));
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, price, quantity, categoryId } = req.body;
  try {
    const product = await ProductService.getProductById(id);
    if (!product) {
      return res.redirect('/?error=' + encodeURIComponent('Product not found'));
    }

    const priceValue = Number(price);
    const quantityValue = Number(quantity);

    if (!name || Number.isNaN(priceValue) || Number.isNaN(quantityValue)) {
      const categories = await CategoryService.getAllCategories();
      return res.status(400).render('edit', {
        product,
        categories,
        error: 'Name, price, and quantity are required.'
      });
    }

    let imageUrl = product.url_image;
    let imageKey = product.imageKey;

    if (req.file) {
      const uploaded = await uploadToS3(req.file);
      imageUrl = uploaded.url;
      imageKey = uploaded.key;
      if (product.imageKey) {
        await deleteFromS3(product.imageKey);
      }
    }

    await ProductService.updateProduct(id, {
      name: name.trim(),
      price: priceValue,
      quantity: quantityValue,
      categoryId: categoryId || null,
      url_image: imageUrl,
      imageKey: imageKey
    }, req.session.user.userId);

    res.redirect('/?message=' + encodeURIComponent('Product updated'));
  } catch (err) {
    console.error('updateProduct error:', err);
    const product = await ProductService.getProductById(id);
    const categories = await CategoryService.getAllCategories();
    res.status(500).render('edit', {
      product,
      categories,
      error: err.message || 'Could not update product.'
    });
  }
}

async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    const product = await ProductService.getProductById(id);
    if (!product) {
      return res.redirect('/?error=' + encodeURIComponent('Product not found'));
    }

    if (product.imageKey) {
      await deleteFromS3(product.imageKey);
    }

    await ProductService.deleteProduct(id, req.session.user.userId);

    res.redirect('/?message=' + encodeURIComponent('Product deleted'));
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.redirect('/?error=' + encodeURIComponent(err.message || 'Could not delete product'));
  }
}

module.exports = {
  listProducts,
  showAddForm,
  createProduct,
  showEditForm,
  updateProduct,
  deleteProduct
};
