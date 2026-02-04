const UserRepository = require('../repositories/UserRepository');

class AuthService {
  /**
   * Đăng ký user mới
   */
  async register(username, password, role = 'staff') {
    try {
      console.log(`[AuthService.register] Attempting to register user: ${username}`);
      // Kiểm tra username tồn tại
      const existingUser = await UserRepository.findByUsername(username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Validate
      if (!username || username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      console.log(`[AuthService.register] Validation passed, creating user with role: ${role}`);
      const user = await UserRepository.create({ username, password, role });
      console.log(`[AuthService.register] User registered successfully`);
      return user;
    } catch (err) {
      console.error('AuthService.register error:', err);
      throw err;
    }
  }

  /**
   * Đăng nhập
   */
  async login(username, password) {
    try {
      const user = await UserRepository.findByUsername(username);
      if (!user) {
        throw new Error('Invalid username or password');
      }

      const isValid = await UserRepository.validatePassword(password, user.password);
      if (!isValid) {
        throw new Error('Invalid username or password');
      }

      // Trả về user mà không có password
      return {
        userId: user.userId,
        username: user.username,
        role: user.role
      };
    } catch (err) {
      console.error('AuthService.login error:', err);
      throw err;
    }
  }

  /**
   * Lấy user info
   */
  async getUserInfo(userId) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return {
        userId: user.userId,
        username: user.username,
        role: user.role
      };
    } catch (err) {
      console.error('AuthService.getUserInfo error:', err);
      throw err;
    }
  }

  /**
   * Kiểm tra quyền admin
   */
  isAdmin(user) {
    return user && user.role === 'admin';
  }

  /**
   * Kiểm tra quyền staff
   */
  isStaff(user) {
    return user && (user.role === 'staff' || user.role === 'admin');
  }
}

module.exports = new AuthService();
