const { masterDB } = require('../config/database');
const mongoose = require('mongoose');
const { decrypt } = require('../utils/crypto');

class ConnectionPool {
  constructor() {
    this.tenantConnections = new Map();
    this.connectionTimeout = 30000; // 30 seconds idle timeout
  }

  async getConnection(tenantId) {
    if (this.tenantConnections.has(tenantId)) {
      const { conn, lastUsed } = this.tenantConnections.get(tenantId);
      
      // Refresh last used time
      this.tenantConnections.set(tenantId, { 
        conn, 
        lastUsed: Date.now() 
      });
      
      return conn;
    }

    const Tenant = masterDB.model('Tenant');
    const tenant = await Tenant.findOne({ tenantId });
    
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const decryptedConnString = decrypt(tenant.databaseConfig.connectionString);
    const conn = await mongoose.createConnection(decryptedConnString, {
      poolSize: 5, // Adjust based on your needs
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });

    this.tenantConnections.set(tenantId, {
      conn,
      lastUsed: Date.now()
    });

    // Start cleanup interval if not already running
    if (!this.cleanupInterval) {
      this.startCleanupInterval();
    }

    return conn;
  }

  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [tenantId, { conn, lastUsed }] of this.tenantConnections.entries()) {
        if (now - lastUsed > this.connectionTimeout) {
          conn.close();
          this.tenantConnections.delete(tenantId);
        }
      }
    }, 60000); // Check every minute
  }

  async closeAll() {
    for (const { conn } of this.tenantConnections.values()) {
      await conn.close();
    }
    this.tenantConnections.clear();
    clearInterval(this.cleanupInterval);
  }
}

// Singleton instance
module.exports = new ConnectionPool();