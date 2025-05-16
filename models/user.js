const mongoose = require('mongoose');
const { masterDB } = require('../config/database');

// models/User.js
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  globalRoles: { 
    type: [String],
    enum: ['superadmin', 'admin', 'support'],
    default: [] 
  },
  tenantRoles: [{
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    roles: [String]
  }],
  
});

module.exports = masterDB.model('User', UserSchema);