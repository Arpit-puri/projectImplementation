const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto');

const masterDB = mongoose.createConnection(process.env.MASTER_DB_URI);

// Tenant connection cache
const tenantConnections = new Map();

/**
 * Get a database connection for a specific tenant
 * @param {String} tenantId - The tenant identifier
 * @returns {Promise<mongoose.Connection>} - Mongoose connection object
 */
async function getTenantConnection(tenantId) {
  if (tenantConnections.has(tenantId)) {
    return tenantConnections.get(tenantId);
  }

  const tenant = await masterDB.model('Tenant').findOne({ tenantId });
  if (!tenant) throw new Error('Tenant not found');

  const decryptedConnString = decrypt(tenant.databaseConfig.connectionString);
  const conn = await mongoose.createConnection(decryptedConnString);

  tenantConnections.set(tenantId, conn);
  return conn;
}

module.exports = { masterDB, getTenantConnection };