# Multi-Tenant Application

A robust multi-tenant application built with Node.js, Express, and MongoDB that supports multiple tenants with isolated databases and role-based access control.

## Features

- 🔐 Multi-tenant architecture with isolated databases
- 👥 Role-based access control (RBAC)
- 🔑 OAuth2 authentication (Google & GitHub)
- 👮‍♂️ Global and tenant-specific roles
- 📝 Audit logging
- 🔄 Connection pooling for tenant databases
- 🔒 Encrypted database connection strings
- 🛡️ JWT-based authentication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Environment variables configured (see Configuration section)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (see Configuration section)

4. Start the application:
```bash
node app.js
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MASTER_DB_URI=mongodb://localhost:27017/master
JWT_SECRET=your_jwt_secret
CRYPTO_SECRET=your_crypto_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Project Structure

```
├── config/
│   ├── database.js      # Database configuration
│   ├── oauth.js         # OAuth configuration
│   └── tenant-manager.js # Tenant management utilities
├── controllers/
│   ├── adminController.js    # Admin operations
│   ├── apiController.js      # API endpoints
│   ├── authcontroller.js     # Authentication
│   └── tenantController.js   # Tenant management
├── middleware/
│   ├── auth-middleware.js    # Authentication middleware
│   └── tenant-middleware.js  # Tenant resolution middleware
├── models/
│   ├── AuditLogs.js     # Audit logging
│   ├── tenant.js        # Tenant model
│   ├── tenantUser.js    # Tenant-User relationship
│   └── user.js          # User model
├── routes/
│   ├── admin-routes.js  # Admin routes
│   ├── api-routes.js    # API routes
│   ├── auth-route.js    # Auth routes
│   └── tenant-route.js  # Tenant routes
├── services/
│   ├── auth-service.js      # Authentication service
│   ├── connection-pool.js   # Database connection pooling
│   └── tenant-service.js    # Tenant management service
└── utils/
    └── crypto.js        # Encryption utilities
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/me` - Get current user info

### Tenant Management
- `POST /tenants` - Create new tenant (Admin only)
- `GET /tenants/my-tenants` - Get user's tenants
- `GET /tenants/:tenantId` - Get tenant details
- `POST /tenants/:tenantId/users` - Add user to tenant
- `PATCH /tenants/:tenantId/users/:userId` - Update user roles

### Admin Operations
- `POST /admin/users/:userId/make-admin` - Make user admin
- `DELETE /admin/users/:userId/remove-admin` - Remove admin privileges
- `GET /admin/users/admins` - List all admins

### API Operations
- `GET /api/data` - Get tenant-specific data
- `POST /api/data` - Create tenant-specific data
- `GET /api/analytics` - Get tenant analytics

## Security Features

- JWT-based authentication
- Role-based access control
- Encrypted database connection strings
- OAuth2 integration
- Audit logging
- Tenant isolation

## Database Architecture

The application uses a hybrid database approach:
- Master database: Stores user accounts, tenant configurations, and cross-tenant data
- Tenant databases: Isolated databases for each tenant's data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 