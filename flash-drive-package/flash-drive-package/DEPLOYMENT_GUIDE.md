# Gas Cylinder Dashboard - Deployment Guide

## Overview
This guide covers deploying your gas cylinder dashboard application to:
1. **GitHub Repository** (Private)
2. **Web Application** (Vercel)
3. **Desktop Application** (Electron builds)

## Prerequisites
- Git installed
- GitHub account
- Vercel account (free tier available)
- Node.js 16+ installed

## Step 1: Prepare for GitHub Repository

### 1.1 Initialize Git Repository
```bash
# Navigate to your project root
cd gas-cylinder-dashboard

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Gas Cylinder Dashboard"
```

### 1.2 Create .gitignore File
Create a `.gitignore` file in your project root:

```gitignore
# Dependencies
node_modules/
*/node_modules/

# Build outputs
dist/
build/
*/dist/
*/build/

# Environment variables
.env
.env.local
.env.production
.env.development

# Database files
*.sqlite
*.sqlite3
*.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Electron build outputs
electron/dist/
electron/out/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary files
*.tmp
*.temp
```

### 1.3 Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name: `gas-cylinder-dashboard`
4. Description: "Gas Cylinder Management Dashboard with Web and Desktop Applications"
5. **Make it Private**
6. Don't initialize with README (you already have one)
7. Click "Create repository"

### 1.4 Push to GitHub
```bash
# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/gas-cylinder-dashboard.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 2: Web Application Deployment (Vercel)

### 2.1 Prepare Environment Variables
Create a `.env.production` file in your project root:

```env
# Backend Configuration
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secure-jwt-secret-key-change-this

# Database Configuration (for production)
DB_TYPE=sqlite
DB_PATH=./database.sqlite

# CORS Configuration
CORS_ORIGIN=https://your-app-name.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2.2 Update Vercel Configuration
Your `vercel.json` is already configured correctly, but let's optimize it:

```json
{
  "version": 2,
  "name": "gas-cylinder-dashboard",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "backend/server.js": {
      "maxDuration": 30
    }
  }
}
```

### 2.3 Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm run install:all`
5. Add environment variables from `.env.production`
6. Deploy

### 2.4 Update Frontend API Configuration
Update your frontend to use the production API URL. In your store or API configuration:

```javascript
// src/lib/store.js or wherever you configure API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app-name.vercel.app/api'
  : 'http://localhost:5000/api';
```

## Step 3: Desktop Application Deployment

### 3.1 Prepare Electron Build
```bash
# Navigate to electron directory
cd electron

# Install dependencies
npm install

# Build for Windows
npm run dist:win

# Build for macOS (if on macOS)
npm run dist:mac

# Build for Linux
npm run dist:linux
```

### 3.2 Create Desktop App Icons
Create icons for your desktop app:
- Windows: `electron/assets/icon.ico` (256x256)
- macOS: `electron/assets/icon.icns` (512x512)
- Linux: `electron/assets/icon.png` (512x512)

### 3.3 Update Electron Configuration
Update `electron/package.json` build configuration:

```json
{
  "build": {
    "appId": "com.gascylinder.dashboard",
    "productName": "Gas Cylinder Dashboard",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "../dist/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ],
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        }
      ],
      "icon": "assets/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### 3.4 Build and Distribute
```bash
# Build all platforms
npm run dist

# Or build specific platform
npm run dist:win
npm run dist:mac
npm run dist:linux
```

The built applications will be in `electron/dist/` directory.

## Step 4: Database Migration for Production

### 4.1 Update Database Configuration
Update `backend/config/database.js` for production:

```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: isProduction ? './database.sqlite' : './database.sqlite',
  logging: !isProduction,
  define: {
    timestamps: true,
    underscored: true
  }
});

module.exports = { sequelize };
```

### 4.2 Database Setup Script
Create a production database setup script:

```javascript
// backend/scripts/setup-production.js
const { sequelize } = require('../config/database');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
// ... import other models

async function setupProductionDatabase() {
  try {
    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✅ Database synced successfully');

    // Create default admin user if not exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@gascylinder.com',
        password: '$2a$10$your-hashed-password-here',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      });
      console.log('✅ Default admin user created');
    }

    console.log('✅ Production database setup complete');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupProductionDatabase();
```

## Step 5: Continuous Deployment Setup

### 5.1 GitHub Actions for Web Deployment
Create `.github/workflows/deploy-web.yml`:

```yaml
name: Deploy Web App

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm run install:all
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### 5.2 GitHub Actions for Desktop Builds
Create `.github/workflows/build-desktop.yml`:

```yaml
name: Build Desktop App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm run install:all
    
    - name: Build frontend
      run: npm run build
    
    - name: Build desktop app
      run: |
        cd electron
        npm run dist:${{ matrix.os == 'windows-latest' && 'win' || matrix.os == 'macos-latest' && 'mac' || 'linux' }}
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: desktop-app-${{ matrix.os }}
        path: electron/dist/
```

## Step 6: Security Considerations

### 6.1 Environment Variables
- Never commit `.env` files to Git
- Use Vercel's environment variable system
- Rotate JWT secrets regularly

### 6.2 API Security
- Enable CORS properly for production domains
- Implement rate limiting
- Use HTTPS in production
- Validate all inputs

### 6.3 Database Security
- Use strong passwords for database access
- Regular backups
- Monitor for suspicious activities

## Step 7: Monitoring and Maintenance

### 7.1 Health Checks
Your API already has a health check endpoint at `/health`

### 7.2 Logging
- Use Vercel's built-in logging
- Consider external logging services (Sentry, LogRocket)

### 7.3 Performance Monitoring
- Vercel Analytics
- Google Analytics for web app
- Custom metrics for business logic

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Update CORS configuration in `backend/server.js`
2. **Database Connection**: Ensure SQLite file is writable in production
3. **Build Failures**: Check Node.js version compatibility
4. **Desktop App Not Starting**: Verify all dependencies are included in build

### Support:
- Vercel Documentation: https://vercel.com/docs
- Electron Builder: https://www.electron.build/
- GitHub Actions: https://docs.github.com/en/actions

## Next Steps

1. **Set up monitoring** for production usage
2. **Implement automated backups** for the database
3. **Add user analytics** to track usage patterns
4. **Create user documentation** for end users
5. **Plan for scaling** as user base grows

---

**Remember**: Always test your deployment in a staging environment before going live with production! 