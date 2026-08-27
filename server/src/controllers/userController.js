const User = require('../models/User');
const Startup = require('../models/Startup');
const AccessRequest = require('../models/AccessRequest');
const Document = require('../models/Document');
const cloudinary = require('../config/cloudinary');

// Staff roles admin may assign (never admin, founder, investor, builder)
const ASSIGNABLE_ROLES = ['citizen', 'reviewer', 'moderator'];

// Only these current roles can be changed via staff assignment
const ROLE_CHANGE_ALLOWED_FROM = ['citizen', 'reviewer', 'moderator'];

exports.getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { organization: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    const counts = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const roleCounts = {
      founder: 0,
      investor: 0,
      admin: 0,
      citizen: 0,
      ecosystem_builder: 0,
      reviewer: 0,
      moderator: 0,
      total: 0,
    };

    counts.forEach((c) => {
      if (c._id && roleCounts[c._id] !== undefined) {
        roleCounts[c._id] = c.count;
      }
    });

    roleCounts.total = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      roleCounts,
      data: users.map((u) => ({
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        companyName: u.companyName || '',
        organization: u.organization || '',
        investmentRange: u.investmentRange || '',
        focus: u.focus || [],
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Allowed staff roles only: ${ASSIGNABLE_ROLES.join(', ')}. Cannot assign admin, founder, investor, or builder.`,
      });
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!ROLE_CHANGE_ALLOWED_FROM.includes(user.role)) {
      return res.status(400).json({
        success: false,
        message:
          'Role can only be changed for citizens, reviewers, or moderators. Founders, investors, and builders keep their registration role.',
      });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Role updated: ${previousRole} → ${role}`,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin account',
        });
      }
    }

    if (user.role === 'founder') {
      const startup = await Startup.findOne({ founder: user._id });
      if (startup) {
        const docs = await Document.find({ startup: startup._id });
        for (const doc of docs) {
          try {
            await cloudinary.uploader.destroy(doc.cloudinaryPublicId, {
              resource_type: doc.resourceType || 'raw',
            });
          } catch (cloudErr) {
            console.error('Cloudinary delete warning:', cloudErr.message);
          }
        }
        await Document.deleteMany({ startup: startup._id });
        await AccessRequest.deleteMany({ startup: startup._id });
        await Startup.deleteOne({ _id: startup._id });
      }
    }

    if (user.role === 'investor') {
      await AccessRequest.deleteMany({ investor: user._id });
    }

    await User.deleteOne({ _id: user._id });

    res.status(200).json({
      success: true,
      message: `User "${user.fullName}" deleted successfully`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};