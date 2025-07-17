@echo off
setlocal enabledelayedexpansion

echo 🚀 Gas Cylinder Dashboard Deployment Script
echo ==========================================

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo [SUCCESS] All prerequisites are met!

REM Step 1: Initialize Git repository
echo [INFO] Step 1: Setting up Git repository...

if not exist ".git" (
    echo [INFO] Initializing Git repository...
    git init
    echo [SUCCESS] Git repository initialized
) else (
    echo [INFO] Git repository already exists
)

REM Check if remote origin exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [WARNING] No remote origin found. You'll need to add it manually:
    echo git remote add origin https://github.com/YOUR_USERNAME/gas-cylinder-dashboard.git
    echo Replace YOUR_USERNAME with your actual GitHub username
    echo.
    pause
)

REM Step 2: Install dependencies
echo [INFO] Step 2: Installing dependencies...
call npm run install:all
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed

REM Step 3: Build the application
echo [INFO] Step 3: Building the application...
call npm run build
if errorlevel 1 (
    echo [ERROR] Failed to build application
    pause
    exit /b 1
)
echo [SUCCESS] Application built successfully

REM Step 4: Setup production database
echo [INFO] Step 4: Setting up production database...
cd backend
call node scripts/setup-production.js
if errorlevel 1 (
    echo [ERROR] Failed to setup production database
    cd ..
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Production database setup complete

REM Step 5: Add and commit files
echo [INFO] Step 5: Committing changes...
git add .
git commit -m "Initial deployment setup"
if errorlevel 1 (
    echo [WARNING] Failed to commit changes (might be no changes to commit)
) else (
    echo [SUCCESS] Changes committed
)

REM Step 6: Push to GitHub
echo [INFO] Step 6: Pushing to GitHub...
git remote get-url origin >nul 2>&1
if not errorlevel 1 (
    git push -u origin main
    if errorlevel 1 (
        echo [WARNING] Failed to push to GitHub
    ) else (
        echo [SUCCESS] Code pushed to GitHub
    )
) else (
    echo [WARNING] Skipping push to GitHub (no remote origin configured)
)

REM Step 7: Deploy to Vercel
echo [INFO] Step 7: Deploying to Vercel...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing Vercel CLI...
    call npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo [WARNING] You need to login to Vercel first.
    echo [INFO] Running: vercel login
    vercel login
)

echo [INFO] Deploying to Vercel...
vercel --prod
if errorlevel 1 (
    echo [ERROR] Failed to deploy to Vercel
    pause
    exit /b 1
)
echo [SUCCESS] Deployment completed!

REM Step 8: Build desktop application
echo [INFO] Step 8: Building desktop application...
cd electron
call npm run dist:win
if errorlevel 1 (
    echo [ERROR] Failed to build desktop application
    cd ..
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Desktop application built

echo.
echo 🎉 Deployment Summary:
echo =====================
echo ✅ Git repository: Ready
echo ✅ Dependencies: Installed
echo ✅ Application: Built
echo ✅ Database: Setup complete
echo ✅ GitHub: Code pushed
echo ✅ Vercel: Deployed
echo ✅ Desktop: Built for Windows
echo.
echo 📋 Next Steps:
echo 1. Access your web app at the Vercel URL provided above
echo 2. Find your desktop app in: electron/dist/
echo 3. Test the application with default credentials:
echo    - Admin: admin/admin123
echo    - Manager: manager/manager123
echo    - Operator: operator/operator123
echo.
echo ⚠️ IMPORTANT: Change default passwords after first login!
echo.
echo 🔧 For future deployments:
echo - Push changes: git push origin main
echo - Deploy web: vercel --prod
echo - Build desktop: cd electron ^&^& npm run dist:win
echo.
echo [SUCCESS] Deployment script completed successfully!
pause 