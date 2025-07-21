@echo off
echo Installing Gas Cylinder Dashboard - Admin Terminal
echo ==============================================

REM Set environment variables for admin configuration
set DEVICE_ROLE=admin
set DEVICE_NAME=Admin-Terminal
set AUTO_LOGIN=true

REM Install dependencies
echo Installing dependencies...
npm install

REM Build the application
echo Building application...
npm run build

REM Install Electron dependencies
echo Installing desktop app...
cd electron
npm install
cd ..

REM Build desktop app
echo Building desktop executable...
npm run desktop:build

echo.
echo Installation complete!
echo Device configured as: ADMIN TERMINAL
echo Auto-login: ENABLED
echo Features: Full system access and user management
echo.
echo To start the application, run: npm run desktop:dev
echo.
pause 