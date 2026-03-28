const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/** POST /api/auth/register */
exports.register = async (req, res) => {
  const { full_name, email, password, role } = req.body;
  try {
    // Check duplicate email
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
    }

    // Hash password with cost factor 12
    const password_hash = await bcrypt.hash(password, 12);

    const user = await UserModel.create({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      role: role || 'staff'
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    logger.error('[Auth] Register', error);
    res.status(500).json({ success: false, message: 'Đăng ký thất bại, vui lòng thử lại' });
  }
};

/** POST /api/auth/login */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findByEmail(email.toLowerCase().trim());

    // Use same error message for both wrong email and wrong password (prevent user enumeration)
    if (!user) {
      // Dummy compare to avoid timing attacks
      await bcrypt.compare(password, '$2a$12$dummyhashtopreventtimingattack00000');
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (error) {
    logger.error('[Auth] Login', error);
    res.status(500).json({ success: false, message: 'Đăng nhập thất bại, vui lòng thử lại' });
  }
};

/** GET /api/auth/me — get current user from token */
exports.getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
