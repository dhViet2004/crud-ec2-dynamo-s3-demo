const { GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_USERS } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

class UserRepository {
  /**
   * Tạo user mới
   */
  async create(userData) {
    try {
      console.log(`[UserRepository.create] Checking for existing username: ${userData.username}`);
      // Kiểm tra duplicate username trước khi tạo
      const existingUser = await this.findByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = {
        userId,
        username: userData.username.trim(),
        password: hashedPassword,
        role: userData.role || 'staff', // default: staff
        createdAt: new Date().toISOString()
      };

      console.log(`[UserRepository.create] Creating new user with ID: ${userId}`);
      const command = new PutCommand({
        TableName: TABLE_USERS,
        Item: user
      });

      await docClient.send(command);
      console.log(`[UserRepository.create] User created successfully`);
      return { ...user, password: undefined }; // Không trả về password
    } catch (err) {
      console.error('UserRepository.create error:', err);
      throw err;
    }
  }

  /**
   * Tìm user theo username
   */
  async findByUsername(username) {
    try {
      console.log(`[UserRepository.findByUsername] Searching for username: ${username}`);
      const command = new ScanCommand({
        TableName: TABLE_USERS,
        FilterExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': username.trim()
        }
      });
      const data = await docClient.send(command);
      console.log(`[UserRepository.findByUsername] Found ${data.Items ? data.Items.length : 0} items`);
      if (data.Items && data.Items.length > 0) {
        console.log(`[UserRepository.findByUsername] Returning user:`, data.Items[0].username);
        return data.Items[0];
      }
      return null;
    } catch (err) {
      console.error('UserRepository.findByUsername error:', err);
      throw err;
    }
  }

  /**
   * Tìm user theo userId
   */
  async findById(userId) {
    try {
      const command = new GetCommand({
        TableName: TABLE_USERS,
        Key: { userId }
      });
      const data = await docClient.send(command);
      return data.Item || null;
    } catch (err) {
      console.error('UserRepository.findById error:', err);
      throw err;
    }
  }

  /**
   * Xác thực mật khẩu
   */
  async validatePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (err) {
      console.error('UserRepository.validatePassword error:', err);
      throw err;
    }
  }

  /**
   * Lấy tất cả users
   */
  async getAll() {
    try {
      const command = new ScanCommand({
        TableName: TABLE_USERS
      });
      const data = await docClient.send(command);
      return (data.Items || []).map(user => ({ ...user, password: undefined }));
    } catch (err) {
      console.error('UserRepository.getAll error:', err);
      throw err;
    }
  }

  /**
   * Cập nhật user
   */
  async update(userId, updates) {
    try {
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};
      let expressionIndex = 0;

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'userId') continue;
        const placeholder = `#attr${expressionIndex}`;
        const valuePlaceholder = `:val${expressionIndex}`;
        
        updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
        expressionAttributeNames[placeholder] = key;
        expressionAttributeValues[valuePlaceholder] = value;
        expressionIndex++;
      }

      const command = new UpdateCommand({
        TableName: TABLE_USERS,
        Key: { userId },
        UpdateExpression: 'SET ' + updateExpressions.join(', '),
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const data = await docClient.send(command);
      return data.Attributes;
    } catch (err) {
      console.error('UserRepository.update error:', err);
      throw err;
    }
  }

  /**
   * Xóa user
   */
  async delete(userId) {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_USERS,
        Key: { userId }
      });
      await docClient.send(command);
      return true;
    } catch (err) {
      console.error('UserRepository.delete error:', err);
      throw err;
    }
  }
}

module.exports = new UserRepository();
