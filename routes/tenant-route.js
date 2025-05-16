const express = require('express');
const router = express.Router();
const tenantService = require('../services/tenant-service');
const authMiddleware = require('../middleware/auth-middleware');
const { masterDB } = require('../config/database');
const TenantUser = masterDB.model('TenantUser');

// Apply auth middleware to all tenant routes
router.use(authMiddleware);

// Create new tenant (admin only)
router.post('/', async (req, res, next) => {
  try {
    // Check if user has admin privileges
    if (!req.user.globalRoles.includes('admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { tenantId, name } = req.body;
    const tenant = await tenantService.createTenant({ tenantId, name });
    
    res.status(201).json({
      message: 'Tenant created successfully',
      tenantId: tenant.tenantId,
      status: tenant.status
    });
  } catch (err) {
    next(err);
  }
});

// Get all tenants user has access to
router.get('/my-tenants', async (req, res, next) => {
  try {
    const tenantUsers = await TenantUser.find({ userId: req.user.userId })
      .populate('tenantId', 'tenantId name status');
    
    res.json(tenantUsers.map(tu => ({
      tenantId: tu.tenantId.tenantId,
      name: tu.tenantId.name,
      status: tu.tenantId.status,
      roles: tu.roles,
      permissions: tu.permissions
    })));
  } catch (err) {
    next(err);
  }
});

// Get tenant details (must have access)
router.get('/:tenantId', async (req, res, next) => {
  try {
    const tenantId = req.params.tenantId;
    
    // Verify user has access to this tenant
    const tenantUser = await TenantUser.findOne({
      userId: req.user.userId,
      'tenantId.tenantId': tenantId
    }).populate('tenantId');
    
    if (!tenantUser) {
      return res.status(403).json({ message: 'Access to tenant denied' });
    }

    res.json({
      tenantId: tenantUser.tenantId.tenantId,
      name: tenantUser.tenantId.name,
      status: tenantUser.tenantId.status,
      yourRoles: tenantUser.roles,
      yourPermissions: tenantUser.permissions
    });
  } catch (err) {
    next(err);
  }
});

// Add user to tenant (tenant admin only)
router.post('/:tenantId/users', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { email, roles } = req.body;

    // Verify requesting user is admin for this tenant
    const requestingUser = await TenantUser.findOne({
      userId: req.user.userId,
      'tenantId.tenantId': tenantId,
      roles: 'admin'
    });
    
    if (!requestingUser) {
      return res.status(403).json({ message: 'Admin access required for this tenant' });
    }

    // Find user by email
    const User = masterDB.model('User');
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has access
    const existingAccess = await TenantUser.findOne({
      userId: user._id,
      'tenantId.tenantId': tenantId
    });
    
    if (existingAccess) {
      return res.status(400).json({ message: 'User already has access to this tenant' });
    }

    // Get tenant document
    const Tenant = masterDB.model('Tenant');
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Create tenant user association
    const tenantUser = new TenantUser({
      userId: user._id,
      tenantId: tenant._id,
      roles: roles || ['user'],
      status: 'active'
    });
    
    await tenantUser.save();

    res.status(201).json({
      message: 'User added to tenant successfully',
      userId: user._id,
      tenantId,
      roles: tenantUser.roles
    });
  } catch (err) {
    next(err);
  }
});

// Update user roles in tenant (tenant admin only)
router.patch('/:tenantId/users/:userId', async (req, res, next) => {
  try {
    const { tenantId, userId } = req.params;
    const { roles } = req.body;

    // Verify requesting user is admin for this tenant
    const requestingUser = await TenantUser.findOne({
      userId: req.user.userId,
      'tenantId.tenantId': tenantId,
      roles: 'admin'
    });
    
    if (!requestingUser) {
      return res.status(403).json({ message: 'Admin access required for this tenant' });
    }

    // Update user roles
    const result = await TenantUser.findOneAndUpdate(
      {
        userId,
        'tenantId.tenantId': tenantId
      },
      { roles },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Tenant user not found' });
    }

    res.json({
      message: 'User roles updated successfully',
      userId,
      tenantId,
      newRoles: result.roles
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;