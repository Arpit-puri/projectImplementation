const express = require('express');
require('dotenv').config();
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const { masterDB } = require('./config/database');
require('./models/user');
require('./models/tenant');
require('./models/tenantuser');
const authRoutes = require('./routes/auth-route');
const apiRoutes = require('./routes/api-routes');
const adminRoutes = require('./routes/admin-routes');
const tenantRoutes = require('./routes/tenant-route');
app.use(morgan('dev'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/tenants', tenantRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});