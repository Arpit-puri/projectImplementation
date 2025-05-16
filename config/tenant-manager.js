const { masterDB } = require('./database');
const mongoose = require('mongoose');
const { encrypt } = require('../utils/crypto');

class TenantManager {
  async createTenantDatabase(tenantId) {
    // Generate unique database name
    const dbName = `tenant_${tenantId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    // Create connection string (in production, use environment-specific config)
    const connectionString = `mongodb://localhost:27017/${dbName}?authSource=admin`;
    
    // Create the actual tenant database
    const tenantConnection = await mongoose.createConnection(connectionString);
    
    // Initialize collections (example)
    this.initializeTenantCollections(tenantConnection);
    
    // Store tenant config in master DB
    const Tenant = masterDB.model('Tenant');
    const tenant = new Tenant({
      tenantId,
      name: tenantId,
      databaseConfig: {
        connectionString: encrypt(connectionString),
        dbName
      },
      status: 'active'
    });
    
    await tenant.save();
    return tenant;
  }

  initializeTenantCollections(connection) {
    // Define your tenant-specific schemas here
    const ExampleSchema = new mongoose.Schema({
      name: String,
      value: Number,
      createdAt: { type: Date, default: Date.now }
    });
    
    connection.model('Example', ExampleSchema);
    
    // Add more collections as needed
    // connection.model('Product', ProductSchema);
    // connection.model('Order', OrderSchema);
  }

  async deleteTenantDatabase(tenantId) {
    // Implementation would:
    // 1. Backup data (if needed)
    // 2. Drop database
    // 3. Update master DB record
    // Note: Actual database dropping requires MongoDB admin privileges
    throw new Error('Not implemented - requires careful handling');
  }
}

module.exports = new TenantManager();