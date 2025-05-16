const { masterDB } = require('../config/database');
const mongoose = require('mongoose');
const TenantUserSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: true 
  },
  roles: { 
    type: [String], 
    default: ['user'] 
  },
  permissions: { 
    type: [String], 
    default: [] 
  },
  status: { 
    type: String, 
    enum: ['active', 'pending', 'revoked'], 
    default: 'pending' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index to ensure unique user-tenant pairs
TenantUserSchema.index({ userId: 1, tenantId: 1 }, { unique: true });

TenantUserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = masterDB.model('TenantUser', TenantUserSchema);