const AuthService = require('../services/AuthService');

/**
 * Hiển thị trang đăng nhập
 */
function showLoginForm(req, res) {
  res.render('auth/login', {
    error: req.query.error || null,
    message: req.query.message || null
  });
}

/**
 * Hiển thị trang đăng ký
 */
function showRegisterForm(req, res) {
  res.render('auth/register', {
    error: req.query.error || null
  });
}

/**
 * Xử lý đăng nhập
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render('auth/login', {
        error: 'Username and password are required',
        message: null
      });
    }

    const user = await AuthService.login(username, password);

    // Lưu vào session
    req.session.user = user;

    res.redirect('/?message=' + encodeURIComponent('Login successful'));
  } catch (err) {
    console.error('login error:', err);
    res.render('auth/login', {
      error: err.message,
      message: null
    });
  }
}

/**
 * Xử lý đăng ký
 */
async function register(req, res) {
  try {
    const { username, password, confirmPassword, role } = req.body;

    if (!username || !password || !confirmPassword) {
      return res.render('auth/register', {
        error: 'All fields are required'
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/register', {
        error: 'Passwords do not match'
      });
    }

    const userRole = role === 'admin' ? 'admin' : 'staff';
    await AuthService.register(username, password, userRole);

    res.redirect('/auth/login?message=' + encodeURIComponent('Registration successful, please login'));
  } catch (err) {
    console.error('register error:', err);
    res.render('auth/register', {
      error: err.message
    });
  }
}

/**
 * Xử lý đăng xuất
 */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('logout error:', err);
      return res.status(500).send('Logout failed');
    }
    res.redirect('/?message=' + encodeURIComponent('Logout successful'));
  });
}

module.exports = {
  showLoginForm,
  showRegisterForm,
  login,
  register,
  logout
};
