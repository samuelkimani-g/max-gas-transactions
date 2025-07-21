@echo off
echo Installing Gas Cylinder Dashboard - Manager Terminal
echo ===============================================

REM Set environment variables for manager configuration
set DEVICE_ROLE=manager
set DEVICE_NAME=Manager-Terminal
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
echo Device configured as: MANAGER TERMINAL
echo Auto-login: ENABLED
echo Features: Full access including approvals and reports
echo.
echo To start the application, run: npm run desktop:dev
echo.
pause 