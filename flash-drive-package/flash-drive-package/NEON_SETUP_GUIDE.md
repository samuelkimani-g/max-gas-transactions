# Neon PostgreSQL Setup Guide

This guide will help you set up Neon PostgreSQL database and connect it to your Vercel deployment.

## 🚀 Step 1: Create Neon Database

### 1.1 Sign up for Neon
1. Go to [neon.tech](https://neon.tech)
2. Sign up with your GitHub account
3. Create a new project

### 1.2 Create Database
1. Click "Create Project"
2. Choose a project name (e.g., "max-gas-transactions")
3. Select a region close to your users
4. Click "Create Project"

### 1.3 Get Connection String
1. In your Neon dashboard, go to "Connection Details"
2. Copy the connection string that looks like:
   ```
   postgresql://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/database?sslmode=require
   ```

## 🔧 Step 2: Install PostgreSQL Dependencies

```bash
# Navigate to backend directory
cd backend

# Install PostgreSQL dependencies
npm install pg pg-hstore
```

## 🌐 Step 3: Deploy to Vercel

### 3.1 Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository: `samuelkimani-g/max-gas-transactions`
4. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm run install:all`

### 3.2 Set Environment Variables
In your Vercel project settings, add these environment variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/database?sslmode=require
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
```

**Replace the DATABASE_URL with your actual Neon connection string**

### 3.3 Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at the provided URL

## 🗄️ Step 4: Setup Production Database

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NODE_ENV

# Deploy
vercel --prod
```

### Option B: Using Vercel Dashboard
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add each variable:
   - `DATABASE_URL`: Your Neon connection string
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: `production`

## 🔍 Step 5: Verify Setup

### 5.1 Test Database Connection
Your app will automatically test the database connection on startup. Check the Vercel logs to see:
```
✅ Database connection established successfully (PostgreSQL)
```

### 5.2 Test Login
Use the default credentials:
- **Admin**: `admin` / `admin123`
- **Manager**: `manager` / `manager123`
- **Operator**: `operator` / `operator123`

## 🔧 Step 6: Local Development

### 6.1 Environment Variables
Create a `.env` file in your project root:
```env
# Development (SQLite)
NODE_ENV=development
PORT=5000
JWT_SECRET=your-dev-jwt-secret

# Production (PostgreSQL) - Only set when testing production config locally
# DATABASE_URL=postgresql://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/database?sslmode=require
```

### 6.2 Run Locally
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev:full
```

## 🚨 Troubleshooting

### Database Connection Issues
1. **Check DATABASE_URL**: Ensure it's correctly formatted
2. **SSL Mode**: Make sure `sslmode=require` is in the connection string
3. **Network Access**: Neon allows connections from anywhere by default

### Vercel Deployment Issues
1. **Build Failures**: Check that all dependencies are installed
2. **Environment Variables**: Ensure they're set in Vercel dashboard
3. **Function Timeout**: Increase timeout in `vercel.json` if needed

### Common Errors
```
❌ Unable to connect to the database
```
- Check your DATABASE_URL format
- Verify Neon database is active
- Ensure SSL is enabled

```
❌ Build failed
```
- Check that `pg` and `pg-hstore` are installed
- Verify all dependencies are in package.json

## 📊 Neon Dashboard Features

### Monitor Usage
- **Compute**: Check CPU and memory usage
- **Storage**: Monitor database size
- **Connections**: View active connections
- **Queries**: Analyze query performance

### Backup & Restore
- Neon automatically backs up your data
- Point-in-time recovery available
- Branch your database for testing

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit DATABASE_URL to git
2. **JWT Secret**: Use a strong, random secret
3. **SSL**: Always use SSL in production
4. **Connection Pooling**: Configured automatically for Neon
5. **Regular Updates**: Keep dependencies updated

## 📈 Scaling

### Neon Free Tier Limits
- **Compute**: 0.5 CPU, 1GB RAM
- **Storage**: 3GB
- **Connections**: 100 concurrent
- **Projects**: Unlimited

### Upgrade When Needed
- Monitor usage in Neon dashboard
- Upgrade plan when approaching limits
- Consider read replicas for high traffic

## 🎉 Success!

Your app is now running with:
- ✅ **Frontend**: React/Vite on Vercel
- ✅ **Backend**: Node.js/Express on Vercel
- ✅ **Database**: PostgreSQL on Neon
- ✅ **SSL**: Secure connections
- ✅ **Auto-scaling**: Handles traffic spikes

---

**Need Help?**
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Issues](https://github.com/samuelkimani-g/max-gas-transactions/issues) 