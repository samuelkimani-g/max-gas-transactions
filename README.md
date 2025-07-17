# Gas Cylinder Management Dashboard

A comprehensive gas cylinder management system with web and desktop applications for tracking customers, transactions, inventory, and analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- PostgreSQL database

### Automated Setup
```bash
# On macOS/Linux
chmod +x quick-start.sh
./quick-start.sh

# On Windows
quick-start.bat
```

### Manual Setup
```bash
# 1. Install dependencies
npm run install:all

# 2. Copy environment file
cp env.example .env

# 3. Edit .env with your database credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/gas_cylinder_db

# 4. Setup database
npm run db:setup

# 5. Seed with sample data
npm run db:seed

# 6. Start development
npm run dev:full
```

## 🌟 Features

### Core Functionality
- **Customer Management**: Add, edit, and track customers with detailed information
- **Transaction Tracking**: Record loads, returns, swipes, and outright sales
- **Inventory Management**: Track cylinder balances by size (6kg, 13kg, 50kg)
- **Payment Processing**: Record payments and track outstanding balances
- **Reporting & Analytics**: Comprehensive reports and forecasting

### Advanced Features
- **Duplicate Prevention**: Smart duplicate checking for customers
- **Address System**: Kenyan county and location dropdown system
- **Data Import/Export**: Excel/CSV import and export functionality
- **Bulk Operations**: Bulk payments and transaction management
- **Offline Mode**: Works without internet connection
- **Mobile Responsive**: Optimized for mobile devices

### Analytics & Reporting
- **Real-time Dashboard**: Live metrics and KPIs
- **Forecasting Engine**: AI-powered sales and demand forecasting
- **Risk Analysis**: Customer risk assessment and volatility metrics
- **Cylinder Analytics**: Detailed breakdown by cylinder size
- **Financial Reports**: Comprehensive financial analysis

## 🏗️ Architecture

### Frontend (React + Vite)
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **Recharts**: Beautiful and responsive charts
- **Radix UI**: Accessible UI components

### Backend (Node.js + Express)
- **Express.js**: Fast, unopinionated web framework
- **Sequelize**: Promise-based ORM for PostgreSQL
- **JWT**: Secure authentication
- **Helmet**: Security middleware
- **Rate Limiting**: API protection

### Database (PostgreSQL)
- **PostgreSQL**: Robust, open-source database
- **Sequelize ORM**: Database abstraction layer
- **Migrations**: Version-controlled database schema
- **Seeding**: Sample data for development

### Desktop App (Electron)
- **Electron**: Cross-platform desktop application
- **Native Menus**: Platform-specific application menus
- **File System Access**: Local file operations
- **Auto-updates**: Automatic application updates

## 📱 Platforms

### Web Application
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Responsive**: Works on tablets and phones
- **PWA Ready**: Progressive Web App capabilities

### Desktop Application
- **Windows**: .exe installer with auto-updates
- **macOS**: .dmg package with native integration
- **Linux**: .AppImage for easy distribution

## 🗄️ Database Setup

### Option 1: Railway (Recommended)
1. Create account at [railway.app](https://railway.app)
2. Add PostgreSQL service
3. Copy connection string to `.env`

### Option 2: Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database

### Option 3: Local PostgreSQL
```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql
# Windows: Download from postgresql.org

# Create database
sudo -u postgres psql
CREATE DATABASE gas_cylinder_db;
CREATE USER gas_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gas_cylinder_db TO gas_user;
\q
```

## 🚀 Deployment

### Web Application

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Build and deploy
npm run build
# Drag dist folder to Netlify
```

#### GitHub Pages
```bash
npm run build
git add dist
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages
```

### Desktop Application
```bash
# Build for Windows
npm run desktop:dist:win

# Build for macOS
npm run desktop:dist:mac

# Build for Linux
npm run desktop:dist:linux

# Build for all platforms
npm run desktop:dist
```

## 📊 Available Scripts

### Development
```bash
npm run dev              # Start frontend development server
npm run backend:dev      # Start backend development server
npm run dev:full         # Start both frontend and backend
npm run desktop:dev      # Start desktop app development
```

### Building
```bash
npm run build            # Build web application
npm run desktop:build    # Build desktop application
npm run build:all        # Build both web and desktop
```

### Database
```bash
npm run db:setup         # Setup database tables
npm run db:seed          # Seed with sample data
npm run backend:setup    # Setup backend database
npm run backend:seed     # Seed backend database
```

### Deployment
```bash
npm run deploy:vercel    # Deploy to Vercel
npm run desktop:dist     # Build desktop distributions
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Database Schema
- **Users**: Authentication and user management
- **Customers**: Customer information and addresses
- **Transactions**: All transaction types and payments
- **Branches**: Multi-branch support

## 📈 Analytics Features

### Real-time Metrics
- Total sales and revenue
- Customer count and growth
- Transaction volume
- Payment collection rates
- Inventory levels

### Forecasting
- Sales forecasting (12 months)
- Demand prediction
- Seasonal analysis
- Risk assessment
- Volatility metrics

### Reports
- Customer payment reports
- Transaction history
- Inventory movement
- Financial statements
- Cylinder balance reports

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **CORS Protection**: Cross-origin resource sharing
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: ORM-based queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions
- **API Docs**: See `API_DOCUMENTATION.md` for API reference
- **Issues**: Report bugs and feature requests on GitHub

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] API integrations
- [ ] Advanced analytics
- [ ] Multi-tenant support
