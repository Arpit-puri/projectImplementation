const express = require('express');
const router = express.Router();
const { getTenantConnection } = require('../config/database');
const authMiddleware = require('../middleware/auth-middleware');
const tenantMiddleware = require('../middleware/tenant-middleware');

// Example tenant-specific route
router.get('/data', 
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    const tenantDb = await getTenantConnection(req.tenantId);
    const data = await tenantDb.model('SomeModel').find();
    res.json(data);
  }
);

module.exports = router;