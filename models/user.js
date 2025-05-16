const mongoose = require('mongoose');
const { masterDB } = require('../config/database');

// const UserSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   oauthId: { type: String },
//   oauthProvider: { type: String },
//   name: { type: String },
//   globalRoles: { type: [String], default: [] },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: true
  },
  globalRoles: { type: [String], default: [] },
  roles: {
    type: [String],
    default: ['user']
  },
  updatedAt: { type: Date, default: Date.now },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = masterDB.model('User', UserSchema);