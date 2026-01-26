const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, s3Client, TABLE_NAME, BUCKET_NAME, REGION } = require('../config/aws');

async function listProducts(req, res) {
  try {
    const data = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    const products = (data.Items || []).sort((a, b) => a.name.localeCompare(b.name));
    res.render('list', {
      products,
      message: req.query.message || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('listProducts error:', err);
    res.status(500).render('list', { products: [], message: null, error: 'Could not load products.' });
  }
}

function showAddForm(_req, res) {
  res.render('add', { error: null });
}

async function createProduct(req, res) {
  const { name, price, quantity } = req.body;
  try {
    if (!name || !price || !quantity) {
      return res.status(400).render('add', { error: 'Please provide name, price, and quantity.' });
    }

    if (!req.file) {
      return res.status(400).render('add', { error: 'Please upload a product image.' });
    }

    const priceValue = Number(price);
    const quantityValue = Number(quantity);

    if (Number.isNaN(priceValue) || Number.isNaN(quantityValue)) {
      return res.status(400).render('add', { error: 'Price and quantity must be numbers.' });
    }

    const { url, key } = await uploadToS3(req.file);

    const product = {
      productId: uuidv4(),
      name: name.trim(),
      price: priceValue,
      quantity: quantityValue,
      url_image: url,
      imageKey: key
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: product }));

    res.redirect('/?message=' + encodeURIComponent('Product created'));
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).render('add', { error: 'Could not create product.' });
  }
}

async function showEditForm(req, res) {
  const { id } = req.params;
  try {
    const { Item } = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { productId: id } }));
    if (!Item) {
      return res.redirect('/?error=' + encodeURIComponent('Product not found'));
    }
    res.render('edit', { product: Item, error: null });
  } catch (err) {
    console.error('showEditForm error:', err);
    res.redirect('/?error=' + encodeURIComponent('Could not load product'));
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, price, quantity } = req.body;
  try {
    const existing = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { productId: id } }));
    if (!existing.Item) {
      return res.redirect('/?error=' + encodeURIComponent('Product not found'));
    }

    const priceValue = Number(price);
    const quantityValue = Number(quantity);

    if (!name || Number.isNaN(priceValue) || Number.isNaN(quantityValue)) {
      return res.status(400).render('edit', { product: existing.Item, error: 'Name, price, and quantity are required.' });
    }

    let imageUrl = existing.Item.url_image;
    let imageKey = existing.Item.imageKey;

    if (req.file) {
      const uploaded = await uploadToS3(req.file);
      imageUrl = uploaded.url;
      imageKey = uploaded.key;
      if (existing.Item.imageKey) {
        await deleteFromS3(existing.Item.imageKey);
      }
    }

    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { productId: id },
      UpdateExpression: 'SET #name = :name, #price = :price, #quantity = :quantity, #url = :url, #imageKey = :imageKey',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#price': 'price',
        '#quantity': 'quantity',
        '#url': 'url_image',
        '#imageKey': 'imageKey'
      },
      ExpressionAttributeValues: {
        ':name': name.trim(),
        ':price': priceValue,
        ':quantity': quantityValue,
        ':url': imageUrl,
        ':imageKey': imageKey
      }
    }));

    res.redirect('/?message=' + encodeURIComponent('Product updated'));
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).render('edit', { product: { productId: id, name, price, quantity }, error: 'Could not update product.' });
  }
}

async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    const { Item } = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { productId: id } }));
    if (Item?.imageKey) {
      await deleteFromS3(Item.imageKey);
    }

    await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { productId: id } }));

    res.redirect('/?message=' + encodeURIComponent('Product deleted'));
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.redirect('/?error=' + encodeURIComponent('Could not delete product'));
  }
}

async function uploadToS3(file) {
  const key = `products/${uuidv4()}-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  });
  await s3Client.send(command);
  const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
  return { url, key };
}

async function deleteFromS3(key) {
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  } catch (_err) {
    // Ignore cleanup errors to keep UX smooth.
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
