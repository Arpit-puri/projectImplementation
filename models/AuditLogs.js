const { masterDB } = require('../config/database');
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['role_assignment', 'role_revocation', 'tenant_creation', 'user_removal']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  changes: {
    addedRoles: [String],
    removedRoles: [String]
  },
  systemNote: String,
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

module.exports = masterDB.model('AuditLog', AuditLogSchema);