const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth-middleware');
const {
  createTenant,
  getMyTenants,
  getTenantDetails,
  addUserToTenant,
  updateUserRoles
} = require('../controllers/tenantController');

router.use(authMiddleware);

router.post('/', createTenant);
router.get('/my-tenants', getMyTenants);
router.get('/:tenantId', getTenantDetails);
router.post('/:tenantId/users', addUserToTenant);
router.patch('/:tenantId/users/:userId', updateUserRoles);

module.exports = router;