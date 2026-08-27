const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const formatUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  companyName: user.companyName || '',
  organization: user.organization || '',
  organizationName: user.organizationName || '',
  builderType: user.builderType || '',
  investmentRange: user.investmentRange || '',
  focus: user.focus || [],
});

// ====================== REGISTER ======================
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fullName, email and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Allow ecosystem_builder (admin is never self-registered)
    const allowedRoles = ['founder', 'investor', 'citizen', 'ecosystem_builder'];
    const userRole = allowedRoles.includes(role) ? role : 'founder';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: userRole,
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// ====================== UPDATE PROFILE ======================
exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      companyName,
      organization,
      organizationName,
      builderType,
      investmentRange,
      focus,
      currentPassword,
      newPassword,
    } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (fullName !== undefined && fullName.trim()) {
      user.fullName = fullName.trim();
    }

    if (user.role === 'founder' && companyName !== undefined) {
      user.companyName = companyName.trim();
    }

    if (user.role === 'investor') {
      if (organization !== undefined) user.organization = organization.trim();
      if (investmentRange !== undefined) user.investmentRange = investmentRange.trim();
      if (focus !== undefined) {
        user.focus = Array.isArray(focus) ? focus : [];
      }
    }

    if (user.role === 'ecosystem_builder') {
      if (organizationName !== undefined) {
        user.organizationName = organizationName.trim();
      }
      if (builderType !== undefined) user.builderType = builderType;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password',
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters',
        });
      }

      user.password = newPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ====================== GET ME ======================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};