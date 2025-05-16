const mongoose = require('mongoose');
const { masterDB } = require('../config/database');
const { encrypt } = require('../utils/crypto');
const Tenant = require('../models/tenant');
const TenantUser = require('../models/tenantUser');

class TenantService {
  /**
   * Create a new tenant
   * @param {Object} tenantData - Basic tenant information
   * @returns {Promise<Object>} - The created tenant
   */
  async createTenant(tenantData) {
    const { tenantId, name, adminEmail, createdBy } = tenantData;
    const exists = await Tenant.findOne({ tenantId });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `Tenant with ID ${tenantId} already exists`
      });
    }
    // Generate a unique database name for the tenant
    const dbName = `tenant_${tenantId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    // Create connection string for this tenant's database
    // Using the same MongoDB instance but a different database name
    const mongoUrl = process.env.MONGODB_BASE_URI || 'mongodb://localhost:27017';
    const connectionString = `${mongoUrl}/${dbName}`;
    
    // Encrypt the connection string before storing
    const encryptedConnString = encrypt(connectionString);
    
    // Create the tenant with database config
    const newTenant = new Tenant({
      tenantId,
      name,
      status: 'pending', // Start with pending status
      databaseConfig: {
        dbName,
        connectionString: encryptedConnString
      }
    });
    
    await newTenant.save();
    
    // If admin email is provided, assign the admin role to that user
    if (adminEmail && createdBy) {
      try {
        // Find user by email
        const User = masterDB.model('User');
        const adminUser = await User.findOne({ email: adminEmail });
        if (adminUser) {
          // Create tenant user association
          await TenantUser.create({
            userId: adminUser._id,
            tenantId: newTenant._id,
            roles: ['admin'],
            status: 'active'
          });
        } else {
          console.warn(`Admin user with email ${adminEmail} not found. No admin assigned to tenant.`);
        }
      } catch (err) {
        console.error('Failed to assign admin to tenant:', err);
      }
    }
    
    // Initialize the tenant database
    await this.initializeTenantDatabase(connectionString);
    
    // Activate the tenant after successful initialization
    newTenant.status = 'active';
    await newTenant.save();
    
    return newTenant;
  }
  
  /**
   * Initialize a new tenant database with required collections
   * @param {string} connectionString - Database connection string
   */
  async initializeTenantDatabase(connectionString) {
    try {
      // Create a connection to the new tenant database
      const conn = await mongoose.createConnection(connectionString);
      
      // Define and initialize tenant-specific schemas and models
      Product.register(conn);

      const ProductSchema = new mongoose.Schema({
        name: { type: String, required: true },
        description: String,
        price: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now }
      });
      
      // Initialize the models
      conn.model('Product', ProductSchema);
      
      // You can create additional models as needed
      
      // Close the connection after initialization
      await conn.close();
      
      console.log(`Tenant database initialized: ${connectionString.split('/').pop()}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize tenant database:', error);
      throw error;
    }
  }

  /**
   * Get a tenant by ID
   * @param {string} tenantId - Tenant identifier
   * @returns {Promise<Object>} - The tenant object
   */
  async getTenantById(tenantId) {
    return Tenant.findOne({ tenantId });
  }
  
  /**
   * Update tenant details
   * @param {string} tenantId - Tenant identifier
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated tenant object
   */
  async updateTenant(tenantId, updateData) {
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);
    
    // Filter out fields that should not be updated directly
    const { databaseConfig, _id, ...safeUpdateData } = updateData;
    
    Object.assign(tenant, safeUpdateData);
    return tenant.save();
  }
  
  /**
   * Change tenant status
   * @param {string} tenantId - Tenant identifier
   * @param {string} status - New status ('active', 'suspended', 'pending')
   * @returns {Promise<Object>} - Updated tenant
   */
  async changeTenantStatus(tenantId, status) {
    const validStatuses = ['active', 'suspended', 'pending'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);
    
    tenant.status = status;
    return tenant.save();
  }
  async deleteTenant(tenantId) {
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) throw new Error('Tenant not found');
    
    // Optional: Backup data first
    
    // Connect to drop database
    const conn = await mongoose.createConnection(
      decrypt(tenant.databaseConfig.connectionString)
    );
    await conn.db.dropDatabase();
    await conn.close();
    
    // Delete tenant record
    await Tenant.deleteOne({ tenantId });
    
    // Delete all tenant user associations
    await TenantUser.deleteMany({ tenantId: tenant._id });
  }
}

module.exports = new TenantService();