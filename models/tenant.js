const mongoose = require('mongoose');
const { masterDB } = require('../config/database');

const TenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'pending' },
  databaseConfig: {
    connectionString: { type: String, required: true },
    dbName: { type: String, required: true }
  },
  oauthConfig: {
    clientId: String,
    clientSecret: String,
    provider: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TenantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = masterDB.model('Tenant', TenantSchema);