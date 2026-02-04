const { GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_CATEGORIES } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

class CategoryRepository {
  /**
   * Tạo danh mục mới
   */
  async create(categoryData) {
    try {
      const categoryId = uuidv4();
      const category = {
        categoryId,
        name: categoryData.name.trim(),
        description: categoryData.description ? categoryData.description.trim() : '',
        createdAt: new Date().toISOString()
      };

      const command = new PutCommand({
        TableName: TABLE_CATEGORIES,
        Item: category
      });

      await docClient.send(command);
      return category;
    } catch (err) {
      console.error('CategoryRepository.create error:', err);
      throw err;
    }
  }

  /**
   * Lấy tất cả danh mục
   */
  async getAll() {
    try {
      const command = new ScanCommand({
        TableName: TABLE_CATEGORIES
      });
      const data = await docClient.send(command);
      return (data.Items || []).sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error('CategoryRepository.getAll error:', err);
      throw err;
    }
  }

  /**
   * Lấy danh mục theo ID
   */
  async getById(categoryId) {
    try {
      const command = new GetCommand({
        TableName: TABLE_CATEGORIES,
        Key: { categoryId }
      });
      const data = await docClient.send(command);
      return data.Item || null;
    } catch (err) {
      console.error('CategoryRepository.getById error:', err);
      throw err;
    }
  }

  /**
   * Cập nhật danh mục
   */
  async update(categoryId, updates) {
    try {
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};
      let expressionIndex = 0;

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'categoryId' || key === 'createdAt') continue;
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
        TableName: TABLE_CATEGORIES,
        Key: { categoryId },
        UpdateExpression: 'SET ' + updateExpressions.join(', '),
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const data = await docClient.send(command);
      return data.Attributes;
    } catch (err) {
      console.error('CategoryRepository.update error:', err);
      throw err;
    }
  }

  /**
   * Xóa danh mục
   * Lưu ý: Business rule - không xóa nếu có sản phẩm liên quan
   */
  async delete(categoryId) {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_CATEGORIES,
        Key: { categoryId }
      });
      await docClient.send(command);
      return true;
    } catch (err) {
      console.error('CategoryRepository.delete error:', err);
      throw err;
    }
  }
}

module.exports = new CategoryRepository();
