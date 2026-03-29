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

/** POST /api/auth/client/register — For customers using phone */
exports.clientRegister = async (req, res) => {
  const { full_name, phone, password } = req.body;
  console.log('[DEBUG] clientRegister called with:', { full_name, phone });
  try {
    // Check duplicate phone
    console.log('[DEBUG] Checking phone:', phone);
    const existingPhone = await UserModel.findByPhone(phone);
    console.log('[DEBUG] existingPhone:', existingPhone);
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Số điện thoại đã được sử dụng' });
    }

    console.log('[DEBUG] Hashing password...');
    const password_hash = await bcrypt.hash(password, 12);
    console.log('[DEBUG] Creating user...');
    const user = await UserModel.create({
      full_name: full_name.trim(),
      email: null, // Client đăng ký bằng phone nên email là null
      phone: phone.trim(),
      password_hash,
      role: 'user'
    });
    console.log('[DEBUG] User created:', user);

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('[DEBUG] clientRegister error:', error);
    logger.error('[Auth] Client Register', error);
    res.status(500).json({ success: false, message: 'Đăng ký thất bại, vui lòng thử lại' });
  }
};

/** POST /api/auth/client/login — For customers using phone */
exports.clientLogin = async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await UserModel.findByPhone(phone.trim());
    if (!user) {
      await bcrypt.compare(password, '$2a$12$dummyhashtopreventtimingattack00000');
      return res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, full_name: user.full_name, phone: user.phone, role: user.role }
    });
  } catch (error) {
    logger.error('[Auth] Client Login', error);
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

/** GET /api/auth/client/profile — get client profile by phone */
exports.getClientProfile = async (req, res) => {
  try {
    // Get phone from query or from token if authenticated
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số điện thoại' });
    }

    const user = await UserModel.findByPhone(phone.trim());
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PUT /api/auth/client/profile — update client profile */
exports.updateClientProfile = async (req, res) => {
  try {
    const { phone, full_name, address } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số điện thoại' });
    }

    const user = await UserModel.findByPhone(phone.trim());
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    const updated = await UserModel.updateById(user.id, {
      full_name: full_name || user.full_name,
      phone: phone || user.phone,
      address: address || user.address
    });

    res.status(200).json({
      success: true,
      user: {
        id: updated.id,
        full_name: updated.full_name,
        phone: updated.phone,
        address: updated.address,
        role: updated.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
