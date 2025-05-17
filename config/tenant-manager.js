const { masterDB } = require('./database');
const mongoose = require('mongoose');
const { encrypt } = require('../utils/crypto');

class TenantManager {
  async createTenantDatabase(tenantId) {
    const dbName = `tenant_${tenantId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const connectionString = `mongodb://localhost:27017/${dbName}?authSource=admin`;
    
    const tenantConnection = await mongoose.createConnection(connectionString);
    
    this.initializeTenantCollections(tenantConnection);
    
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
    //TODO make different file for such cases
    const ExampleSchema = new mongoose.Schema({
      name: String,
      value: Number,
      createdAt: { type: Date, default: Date.now }
    });
    
    connection.model('Example', ExampleSchema);
    
    // Add more collections as needed or make different file for such cases and import here
    // connection.model('Product', ProductSchema);
    // connection.model('Order', OrderSchema);
  }

  async deleteTenantDatabase(tenantId) {
    // TODO - Implementation would:
    // 1. Backup data (if needed)
    // 2. Drop database
    // 3. Update master DB record
    // Note: Actual database dropping requires MongoDB admin privileges
    throw new Error('Not implemented - requires careful handling');
  }
}

module.exports = new TenantManager();