# Environment Variables Setup Guide

## 🔒 **SECURITY WARNING**
**NEVER commit your actual DATABASE_URL or JWT_SECRET to git!**

## 📋 **Required Environment Variables**

### For Local Development (.env file)
Create a `.env` file in your project root:

```env
# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_lvMj5ztu9dSq@ep-still-forest-a18968mz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-change-this

# Server Configuration
NODE_ENV=development
PORT=5000
```

### For Vercel Production
Set these in your Vercel project settings:

```env
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_lvMj5ztu9dSq@ep-still-forest-a18968mz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
```

## 🚀 **Quick Setup Commands**

### Local Development
```bash
# Create .env file (copy and paste your values)
echo "DATABASE_URL=postgresql://neondb_owner:npg_lvMj5ztu9dSq@ep-still-forest-a18968mz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" > .env
echo "JWT_SECRET=your-super-secure-jwt-secret-key-change-this" >> .env
echo "NODE_ENV=development" >> .env
echo "PORT=5000" >> .env
```

### Vercel CLI Setup
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

## 🔧 **Vercel Dashboard Setup**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_lvMj5ztu9dSq@ep-still-forest-a18968mz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Production |
| `JWT_SECRET` | `your-super-secure-jwt-secret-key-change-this` | Production |

## 🧪 **Test Your Setup**

### Test Database Connection
```bash
# Test local connection
npm run db:setup-prod-pg

# Or test from backend directory
cd backend
node scripts/setup-production-pg.js
```

### Expected Output
```
🚀 Starting production PostgreSQL database setup...
✅ Database connection established successfully
✅ Database tables synced successfully
✅ Default admin user created
✅ Default manager user created
✅ Default operator user created
✅ Default branch created
✅ Production PostgreSQL database setup complete!
```

## 🔍 **Verify in Vercel**

After deployment, check your Vercel function logs to see:
```
✅ Database connection established successfully (PostgreSQL)
```

## 🚨 **Security Checklist**

- [ ] `.env` file is in `.gitignore`
- [ ] No credentials in committed code
- [ ] JWT_SECRET is a strong random string
- [ ] Environment variables set in Vercel
- [ ] SSL enabled in database connection

## 🔄 **Update Your JWT Secret**

Generate a secure JWT secret:
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Replace `your-super-secure-jwt-secret-key-change-this` with the generated value.

---

**Your Neon database is ready! 🎉** 