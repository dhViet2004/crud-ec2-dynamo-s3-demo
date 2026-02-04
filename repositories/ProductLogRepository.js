const { PutCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_LOGS } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

class ProductLogRepository {
  /**
   * Ghi log hành động (CREATE/UPDATE/DELETE)
   */
  async log(productId, action, userId) {
    try {
      const logId = uuidv4();
      const logEntry = {
        logId,
        productId,
        action, // CREATE, UPDATE, DELETE
        userId,
        time: new Date().toISOString()
      };

      const command = new PutCommand({
        TableName: TABLE_LOGS,
        Item: logEntry
      });

      await docClient.send(command);
      return logEntry;
    } catch (err) {
      console.error('ProductLogRepository.log error:', err);
      throw err;
    }
  }

  /**
   * Lấy lịch sử log của một sản phẩm
   */
  async getProductLogs(productId) {
    try {
      const command = new ScanCommand({
        TableName: TABLE_LOGS,
        FilterExpression: 'productId = :productId',
        ExpressionAttributeValues: {
          ':productId': productId
        }
      });
      const data = await docClient.send(command);
      return (data.Items || []).sort((a, b) => new Date(b.time) - new Date(a.time));
    } catch (err) {
      console.error('ProductLogRepository.getProductLogs error:', err);
      throw err;
    }
  }

  /**
   * Lấy tất cả logs
   */
  async getAll() {
    try {
      const command = new ScanCommand({
        TableName: TABLE_LOGS
      });
      const data = await docClient.send(command);
      return (data.Items || []).sort((a, b) => new Date(b.time) - new Date(a.time));
    } catch (err) {
      console.error('ProductLogRepository.getAll error:', err);
      throw err;
    }
  }

  /**
   * Lấy logs theo user
   */
  async getUserLogs(userId) {
    try {
      const command = new ScanCommand({
        TableName: TABLE_LOGS,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      });
      const data = await docClient.send(command);
      return (data.Items || []).sort((a, b) => new Date(b.time) - new Date(a.time));
    } catch (err) {
      console.error('ProductLogRepository.getUserLogs error:', err);
      throw err;
    }
  }
}

module.exports = new ProductLogRepository();
