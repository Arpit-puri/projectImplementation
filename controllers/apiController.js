const { getTenantConnection } = require('../config/database');

/**
 * @desc    Get tenant-specific data
 * @route   GET /api/data
 * @access  Private/TenantMember
 */
exports.getTenantData = async (req, res, next) => {
  try {
    const tenantDb = await getTenantConnection(req.tenantId);
    const SomeModel = tenantDb.model('SomeModel');
    
    const data = await SomeModel.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create tenant-specific data
 * @route   POST /api/data
 * @access  Private/TenantMember
 */
exports.createTenantData = async (req, res, next) => {
  try {
    const tenantDb = await getTenantConnection(req.tenantId);
    const SomeModel = tenantDb.model('SomeModel');
    
    // Verify permissions if needed
    if (!req.tenantRoles.includes('editor')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Editor role required'
      });
    }

    const newItem = await SomeModel.create({
      ...req.body,
      createdBy: req.user.id,
      tenantId: req.tenantId
    });

    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tenant analytics
 * @route   GET /api/analytics
 * @access  Private/TenantAdmin
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    // Verify tenant admin
    if (!req.tenantRoles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Tenant admin required'
      });
    }

    const tenantDb = await getTenantConnection(req.tenantId);
    const analytics = await tenantDb.model('Analytics')
      .findOne({ tenantId: req.tenantId })
      .lean();

    res.status(200).json({
      success: true,
      data: analytics || {}
    });
  } catch (err) {
    next(err);
  }
};