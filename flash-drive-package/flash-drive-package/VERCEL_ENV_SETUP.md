# Vercel Environment Variables Setup

## Frontend Environment Variables

Add these in your Vercel dashboard under Settings → Environment Variables:

### Production Variables:
```
VITE_API_URL = https://max-gas-backend.onrender.com/api
VITE_APP_NAME = Gas Cylinder Manager
VITE_APP_VERSION = 1.0.0
NODE_ENV = production
```

### Development Variables (Optional):
```
VITE_API_URL = http://localhost:5000/api
```

## How to Add in Vercel:

1. Go to https://vercel.com/dashboard
2. Click on your project: `max-gas-transactions`
3. Go to Settings → Environment Variables
4. Click "Add New"
5. Add each variable with:
   - Key: Variable name (e.g., VITE_API_URL)
   - Value: Variable value (e.g., https://max-gas-backend.onrender.com/api)
   - Environment: Production (and Preview if needed)

## After Adding Variables:

1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy" to apply new environment variables

## Verification:

Your app should now use the environment variables and connect to the Render backend automatically. 