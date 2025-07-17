@echo off
echo 🚀 Gas Cylinder Dashboard - Quick Start
echo ======================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install all dependencies
echo 📦 Installing dependencies...
call npm run install:all

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  No .env file found. Creating from template...
    copy env.example .env
    echo 📝 Please edit .env file with your database credentials
    echo    Then run this script again
    pause
    exit /b 1
)

REM Setup database
echo 🗄️  Setting up database...
call npm run db:setup

REM Seed database with sample data
echo 🌱 Seeding database with sample data...
call npm run db:seed

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Available commands:
echo   npm run dev          - Start frontend development server
echo   npm run backend:dev  - Start backend development server
echo   npm run dev:full     - Start both frontend and backend
echo   npm run desktop:dev  - Start desktop app development
echo.
echo 🌐 Web App: http://localhost:3000
echo 🔧 API: http://localhost:5000
echo.
echo 📚 For more information, see DEPLOYMENT_GUIDE.md
pause 