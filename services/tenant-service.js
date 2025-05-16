const { masterDB } = require('../config/database');

class TenantService {
  async createTenant(tenantData) {
    const Tenant = masterDB.model('Tenant');
    const newTenant = new Tenant(tenantData);
    await newTenant.save();
    
    // Here you would also:
    // 1. Create the actual tenant database
    // 2. Set up initial collections
    // 3. Create admin user if needed
    
    return newTenant;
  }

  async getTenantById(tenantId) {
    return masterDB.model('Tenant').findOne({ tenantId });
  }
}

module.exports = new TenantService();