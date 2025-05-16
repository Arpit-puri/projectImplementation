require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { masterDB } = require('./config/database');
require('./models/user');
require('./models/tenant');
require('./models/tenantuser');
const authRoutes = require('./routes/auth-route');
const apiRoutes = require('./routes/api-routes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

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