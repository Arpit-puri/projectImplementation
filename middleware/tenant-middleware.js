function resolveTenant(req, res, next) {
    const requestedTenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    
    if (!requestedTenantId) {
      return res.status(400).send('Tenant ID not specified');
    }
  
    // Check if user has access to this tenant
    const userTenant = req.user.tenants.find(t => t.tenantId === requestedTenantId);
    
    if (!userTenant) {
      return res.status(403).send('Access to tenant denied');
    }
  
    req.tenantId = requestedTenantId;
    req.tenantRoles = userTenant.roles;
    next();
  }
  
  module.exports = resolveTenant;