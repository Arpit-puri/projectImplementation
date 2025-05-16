const { masterDB } = require('../config/database');
const User = masterDB.model('User');
// const AuditLog = masterDB.model('AuditLog');

/**
 * @desc    Make user an admin (Superadmin only)
 * @route   POST /api/admin/users/:userId/make-admin
 * @access  Private/Superadmin
 */
exports.makeAdmin = async (req, res, next) => {
  try {
    // Verify superadmin privileges
    if (!req?.user?.globalRoles?.includes('superadmin') || !req?.user?.globalRoles) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Superadmin privileges required'
      });
    }

    const { userId } = req.params;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { globalRoles: 'admin' } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log admin action
    // await AuditLog.create({
    //   action: 'role_assignment',
    //   performedBy: req.user.id,
    //   targetUser: user._id,
    //   changes: {
    //     addedRoles: ['admin'],
    //     removedRoles: []
    //   },
    //   systemNote: `${user.email} was granted admin privileges`
    // });

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        currentRoles: user.globalRoles
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove admin privileges (Superadmin only)
 * @route   DELETE /api/admin/users/:userId/remove-admin
 * @access  Private/Superadmin
 */
exports.removeAdmin = async (req, res, next) => {
  try {
    // Verify superadmin privileges
    if (!req.user.globalRoles.includes('superadmin')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Superadmin privileges required'
      });
    }

    const { userId } = req.params;

    // Prevent self-demotion
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove your own admin privileges'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { globalRoles: 'admin' } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log admin action
    // await AuditLog.create({
    //   action: 'role_revocation',
    //   performedBy: req.user.id,
    //   targetUser: user._id,
    //   changes: {
    //     addedRoles: [],
    //     removedRoles: ['admin']
    //   },
    //   systemNote: `${user.email} had admin privileges revoked`
    // });

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        currentRoles: user.globalRoles
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all admin users
 * @route   GET /api/admin/users/admins
 * @access  Private/Admin
 */
exports.listAdmins = async (req, res, next) => {
  try {
    // Verify admin privileges
    if (!req.user.globalRoles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin privileges required'
      });
    }

    const admins = await User.find(
      { globalRoles: 'admin' },
      'email globalRoles createdAt lastLogin'
    ).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (err) {
    next(err);
  }
};