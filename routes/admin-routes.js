const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth-middleware');
const {
  makeAdmin,
  removeAdmin,
  listAdmins
} = require('../controllers/adminController');

router.use(authMiddleware);

router.post('/users/:userId/make-admin', makeAdmin);
router.delete('/users/:userId/remove-admin', removeAdmin);
router.get('/users/admins', listAdmins);

module.exports = router;