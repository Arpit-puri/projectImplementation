const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth-middleware');
const tenantMiddleware = require('../middleware/tenant-middleware');
const {
  getTenantData,
  createTenantData,
  getAnalytics
} = require('../controllers/apiController');

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/data', getTenantData);
router.post('/data', createTenantData);
router.get('/analytics', getAnalytics);

module.exports = router;