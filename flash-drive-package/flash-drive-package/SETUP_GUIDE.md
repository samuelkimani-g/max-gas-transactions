# Gas Cylinder Dashboard - Complete Setup Guide

## 🚀 Overview

This is a full-stack gas cylinder management dashboard with a React frontend and Node.js backend. The system supports multi-branch operations, customer management, transaction tracking, and comprehensive reporting.

## 📋 Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **PostgreSQL** (v12 or higher)
- **Git**

### Optional (for development)
- **Postman** (for API testing)
- **pgAdmin** (PostgreSQL GUI)
- **VS Code** (recommended editor)

## 🗄️ Database Setup

### 1. Install PostgreSQL

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for the `postgres` user

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL as postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE gas_cylinder_db;
CREATE USER gas_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE gas_cylinder_db TO gas_user;
\q
```

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gas_cylinder_db
DB_USER=gas_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Optional: Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Database Setup and Seeding

```bash
# Run the setup script (creates tables and seeds initial data)
npm run setup
```

This will:
- Create all database tables
- Seed initial data (branches, users, customers, transactions)
- Set up default admin user

### 5. Start Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The backend will be available at: `http://localhost:5000`

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd ..  # Go back to root directory
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Frontend Development Server
```bash
npm run dev
```

The frontend will be available at: `http://localhost:3000`

## 🔑 Default Login Credentials

After running the setup script, you can login with:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Admin | admin | admin123 | admin@maxgas.com |
| Manager | manager1 | manager123 | manager1@maxgas.com |
| Operator | operator1 | operator123 | operator1@maxgas.com |

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Customers
- `GET /api/customers` - Get all customers (with pagination/filters)
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer (admin/manager only)
- `GET /api/customers/:id/transactions` - Get customer transactions
- `GET /api/customers/search/quick` - Quick customer search
- `POST /api/customers/:id/payment` - Record customer payment

### Transactions
- `GET /api/transactions` - Get all transactions (with pagination/filters)
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction (admin only)
- `POST /api/transactions/:id/payment` - Record additional payment
- `GET /api/transactions/stats/summary` - Get transaction statistics

### Reports
- `GET /api/reports/sales` - Sales report with filters
- `GET /api/reports/customers` - Customer analytics report
- `GET /api/reports/inventory` - Inventory/cylinder usage report
- `GET /api/reports/branches` - Branch performance report (admin only)
- `GET /api/reports/export` - Export data to Excel/CSV

## 🏗️ System Architecture

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

### Frontend Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS
- **Charts**: Chart.js
- **Icons**: Lucide React
- **State Management**: React Context + Local Storage

### Database Schema
- **Users**: Authentication and authorization
- **Branches**: Multi-branch support
- **Customers**: Customer management with credit limits
- **Transactions**: Gas cylinder transactions with detailed pricing

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (Admin, Manager, Operator, Viewer)
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection protection (Sequelize ORM)

## 📱 Features

### Core Features
- Multi-branch management
- Customer management with credit limits
- Transaction processing (refills, outright sales, swipes)
- Real-time balance tracking
- Payment processing
- Invoice generation

### Reporting & Analytics
- Sales reports with date filtering
- Customer analytics
- Inventory/cylinder usage tracking
- Branch performance comparison
- Data export (Excel/CSV)

### User Management
- Role-based access control
- User activity tracking
- Password management
- Branch assignment

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=gas_cylinder_db
DB_USER=gas_user
DB_PASSWORD=your_secure_production_password
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-domain.com
```

### Deployment Options
1. **Traditional VPS**: Deploy to DigitalOcean, AWS EC2, etc.
2. **Container**: Docker deployment
3. **Cloud Platforms**: Heroku, Railway, Render
4. **Serverless**: AWS Lambda, Vercel

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd ..
npm test
```

## 📝 Development Scripts

### Backend
```bash
npm run dev          # Start development server
npm run setup        # Setup database and seed data
npm run seed         # Seed initial data only
npm test             # Run tests
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port

3. **JWT Secret Error**
   - Generate a new JWT_SECRET
   - Use a long, random string

4. **CORS Errors**
   - Check FRONTEND_URL in backend `.env`
   - Ensure frontend URL matches exactly

### Getting Help
- Check the console logs for error messages
- Verify all environment variables are set
- Ensure all dependencies are installed
- Check database connection and permissions

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check console logs for error messages
4. Verify environment configuration

## 🔄 Updates

To update the system:
1. Pull latest changes from Git
2. Run `npm install` in both frontend and backend
3. Update environment variables if needed
4. Restart the servers

---

**Happy coding! 🎉** 