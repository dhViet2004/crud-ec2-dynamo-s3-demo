/**
 * Middleware kiểm tra xác thực
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('Please login first'));
  }
  next();
}

/**
 * Middleware kiểm tra admin
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('Please login first'));
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error', { message: 'You do not have permission to access this resource' });
  }
  
  next();
}

/**
 * Middleware gắn user vào locals
 */
function attachUser(req, res, next) {
  res.locals.user = req.session?.user || null;
  res.locals.isAdmin = req.session?.user?.role === 'admin';
  res.locals.isStaff = req.session?.user?.role === 'staff' || req.session?.user?.role === 'admin';
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  attachUser
};
