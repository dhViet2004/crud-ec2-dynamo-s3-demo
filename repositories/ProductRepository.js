const { ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_PRODUCTS } = require('../config/aws');

class ProductRepository {
  /**
   * Lấy tất cả sản phẩm (không bao gồm isDeleted = true)
   */
  async getAll() {
    try {
      const command = new ScanCommand({
        TableName: TABLE_PRODUCTS,
        FilterExpression: 'attribute_not_exists(isDeleted) OR isDeleted = :false',
        ExpressionAttributeValues: {
          ':false': false
        }
      });
      const data = await docClient.send(command);
      return data.Items || [];
    } catch (err) {
      console.error('ProductRepository.getAll error:', err);
      throw err;
    }
  }

  /**
   * Lấy sản phẩm theo ID
   */
  async getById(productId) {
    try {
      const command = new GetCommand({
        TableName: TABLE_PRODUCTS,
        Key: { productId }
      });
      const data = await docClient.send(command);
      
      // Kiểm tra soft delete
      if (data.Item && data.Item.isDeleted) {
        return null;
      }
      return data.Item || null;
    } catch (err) {
      console.error('ProductRepository.getById error:', err);
      throw err;
    }
  }

  /**
   * Tạo sản phẩm mới
   */
  async create(product) {
    try {
      const command = new PutCommand({
        TableName: TABLE_PRODUCTS,
        Item: {
          ...product,
          createdAt: new Date().toISOString(),
          isDeleted: false
        }
      });
      await docClient.send(command);
      return product;
    } catch (err) {
      console.error('ProductRepository.create error:', err);
      throw err;
    }
  }

  /**
   * Cập nhật sản phẩm
   */
  async update(productId, updates) {
    try {
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};
      let expressionIndex = 0;

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'productId') continue; // Không update ID
        const placeholder = `#attr${expressionIndex}`;
        const valuePlaceholder = `:val${expressionIndex}`;
        
        updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
        expressionAttributeNames[placeholder] = key;
        expressionAttributeValues[valuePlaceholder] = value;
        expressionIndex++;
      }

      if (updateExpressions.length === 0) {
        return null;
      }

      const command = new UpdateCommand({
        TableName: TABLE_PRODUCTS,
        Key: { productId },
        UpdateExpression: 'SET ' + updateExpressions.join(', '),
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const data = await docClient.send(command);
      return data.Attributes;
    } catch (err) {
      console.error('ProductRepository.update error:', err);
      throw err;
    }
  }

  /**
   * Soft delete sản phẩm (đánh dấu isDeleted = true)
   */
  async softDelete(productId) {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_PRODUCTS,
        Key: { productId },
        UpdateExpression: 'SET isDeleted = :true, deletedAt = :now',
        ExpressionAttributeValues: {
          ':true': true,
          ':now': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      });

      const data = await docClient.send(command);
      return data.Attributes;
    } catch (err) {
      console.error('ProductRepository.softDelete error:', err);
      throw err;
    }
  }

  /**
   * Hard delete sản phẩm (xóa vĩnh viễn)
   */
  async delete(productId) {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_PRODUCTS,
        Key: { productId }
      });
      await docClient.send(command);
      return true;
    } catch (err) {
      console.error('ProductRepository.delete error:', err);
      throw err;
    }
  }

  /**
   * Tìm kiếm sản phẩm theo categoryId
   * Lưu ý: DynamoDB không có JOIN, nên ta phải scan và filter
   */
  async findByCategory(categoryId) {
    try {
      const command = new ScanCommand({
        TableName: TABLE_PRODUCTS,
        FilterExpression: 'categoryId = :catId AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
        ExpressionAttributeValues: {
          ':catId': categoryId,
          ':false': false
        }
      });
      const data = await docClient.send(command);
      return data.Items || [];
    } catch (err) {
      console.error('ProductRepository.findByCategory error:', err);
      throw err;
    }
  }

  /**
   * Tìm kiếm sản phẩm theo tên (contains)
   * Lưu ý: Sử dụng contains function trong FilterExpression
   */
  async findByName(searchTerm) {
    try {
      const command = new ScanCommand({
        TableName: TABLE_PRODUCTS,
        FilterExpression: 'contains(#name, :search) AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':search': searchTerm,
          ':false': false
        }
      });
      const data = await docClient.send(command);
      return data.Items || [];
    } catch (err) {
      console.error('ProductRepository.findByName error:', err);
      throw err;
    }
  }
}

module.exports = new ProductRepository();
