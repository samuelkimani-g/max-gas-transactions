# Deploy Backend to Render

## Quick Deployment Steps

### 1. **Push to GitHub**
```bash
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

### 2. **Create Render Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `backend` folder as root directory

### 3. **Configure Service**
- **Name**: `max-gas-backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

### 4. **Environment Variables**
Add these in Render dashboard:
```
NODE_ENV=production
JWT_SECRET=MaxGas2024!SecureKey#789
JWT_EXPIRES_IN=7d
DATABASE_URL=your-neon-database-url-here
```

### 5. **Update Frontend**
Once deployed, update your frontend `src/lib/store.js`:
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://max-gas-backend.onrender.com/api' 
  : 'http://localhost:5000/api'
```

## Your Neon Database URL
Replace `your-neon-database-url-here` with your actual Neon connection string:
```
postgresql://username:password@host/database?sslmode=require
```

## Health Check
Render will check: `https://your-app.onrender.com/health` 