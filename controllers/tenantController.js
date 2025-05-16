const tenantService = require('../services/tenant-service');
const { masterDB } = require('../config/database');
const TenantUser = masterDB.model('TenantUser');

/**
 * @desc    Create a new tenant (Admin only)
 * @route   POST /api/tenants
 * @access  Private/Admin
 */
exports.createTenant = async (req, res, next) => {
  try {
    // Validate admin privileges
    if (!req.user.globalRoles.includes('admin') && !req.user.globalRoles.includes('superadmin')) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: Admin privileges required' 
      });
    }
    const { tenantId, name, adminEmail } = req.body;
    if (exists) {
      throw new Error(`Tenant with ID ${tenantId} already exists`);
    }
    // Validate required fields
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Factory ID is required'
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Factory name is required'
      });
    }
    
    // Create tenant
    const tenant = await tenantService.createTenant({ 
      tenantId, 
      name,
      adminEmail,
      createdBy: req.user ? req.user.id : null
    });
    
    // Return success response
    res.status(201).json({
      success: true,
      data: {
        tenantId: tenant.tenantId,
        name: tenant.name,
        status: tenant.status,
        adminEmail
      }
    });
  } catch (err) {
    console.error('Error creating tenant:', err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    if (err.code === 11000) { // Duplicate key error
      return res.status(409).json({
        success: false,
        message: 'A factory with this ID already exists'
      });
    }
    
    next(err);
  }
};

/**
 * @desc    Get all tenants for current user
 * @route   GET /api/tenants/my-tenants
 * @access  Private
 */
exports.getMyTenants = async (req, res, next) => {
  try {
    const tenantUsers = await TenantUser.find({ userId: req.user.id })
      .populate('tenantId', 'tenantId name status createdAt')
      .lean();

    if (!tenantUsers || tenantUsers.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No tenants found for this user'
      });
    }

    const formattedTenants = tenantUsers.map(tu => ({
      id: tu.tenantId._id,
      tenantId: tu.tenantId.tenantId,
      name: tu.tenantId.name,
      status: tu.tenantId.status,
      createdAt: tu.tenantId.createdAt,
      access: {
        roles: tu.roles,
        permissions: tu.permissions,
        status: tu.status
      }
    }));

    res.status(200).json({
      success: true,
      count: formattedTenants.length,
      data: formattedTenants
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tenant details
 * @route   GET /api/tenants/:tenantId
 * @access  Private (Tenant members only)
 */
exports.getTenantDetails = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    // Verify user access
    const tenantUser = await TenantUser.findOne({
      userId: req.user.id,
      'tenantId.tenantId': tenantId
    }).populate('tenantId');

    if (!tenantUser) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: No access to this tenant'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tenantId: tenantUser.tenantId.tenantId,
        name: tenantUser.tenantId.name,
        status: tenantUser.tenantId.status,
        createdAt: tenantUser.tenantId.createdAt,
        yourAccess: {
          roles: tenantUser.roles,
          permissions: tenantUser.permissions,
          status: tenantUser.status
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add user to tenant (Tenant admin only)
 * @route   POST /api/tenants/:tenantId/users
 * @access  Private/TenantAdmin
 */
exports.addUserToTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { email, roles } = req.body;

    // Verify requester is tenant admin
    const isAdmin = await TenantUser.exists({
      userId: req.user.id,
      'tenantId.tenantId': tenantId,
      roles: 'admin'
    });

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Tenant admin privileges required'
      });
    }

    // Find user and tenant
    const [user, tenant] = await Promise.all([
      masterDB.model('User').findOne({ email }),
      masterDB.model('Tenant').findOne({ tenantId })
    ]);

    if (!user || !tenant) {
      return res.status(404).json({
        success: false,
        message: user ? 'Tenant not found' : 'User not found'
      });
    }

    // Check existing access
    const existingAccess = await TenantUser.findOne({
      userId: user._id,
      tenantId: tenant._id
    });

    if (existingAccess) {
      return res.status(400).json({
        success: false,
        message: 'User already has access to this tenant'
      });
    }

    // Create tenant access
    const tenantUser = await TenantUser.create({
      userId: user._id,
      tenantId: tenant._id,
      roles: roles || ['member'],
      status: 'active',
      invitedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        tenantId,
        roles: tenantUser.roles,
        status: tenantUser.status
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user roles in tenant (Tenant admin only)
 * @route   PATCH /api/tenants/:tenantId/users/:userId
 * @access  Private/TenantAdmin
 */
exports.updateUserRoles = async (req, res, next) => {
  try {
    const { tenantId, userId } = req.params;
    const { roles } = req.body;

    // Verify requester is tenant admin
    const isAdmin = await TenantUser.exists({
      userId: req.user.id,
      'tenantId.tenantId': tenantId,
      roles: 'admin'
    });

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Tenant admin privileges required'
      });
    }

    // Update roles
    const updatedUser = await TenantUser.findOneAndUpdate(
      {
        userId,
        'tenantId.tenantId': tenantId
      },
      { roles },
      { new: true, runValidators: true }
    ).populate('userId', 'email name');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Tenant user not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: updatedUser.userId._id,
        email: updatedUser.userId.email,
        tenantId,
        newRoles: updatedUser.roles
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove user from tenant (Tenant admin only)
 * @route   DELETE /api/tenants/:tenantId/users/:userId
 * @access  Private/TenantAdmin
 */
exports.removeUserFromTenant = async (req, res, next) => {
  try {
    const { tenantId, userId } = req.params;

    // Verify requester is tenant admin
    const isAdmin = await TenantUser.exists({
      userId: req.user.id,
      'tenantId.tenantId': tenantId,
      roles: 'admin'
    });

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Tenant admin privileges required'
      });
    }

    // Prevent self-removal
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove yourself from tenant'
      });
    }

    const result = await TenantUser.findOneAndDelete({
      userId,
      'tenantId.tenantId': tenantId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Tenant user not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId,
        tenantId,
        message: 'User removed from tenant'
      }
    });
  } catch (err) {
    next(err);
  }
};