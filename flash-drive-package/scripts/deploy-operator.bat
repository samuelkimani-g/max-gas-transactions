@echo off
echo Installing Gas Cylinder Dashboard - Operator Terminal
echo ================================================

REM Set environment variables for operator configuration
set DEVICE_ROLE=operator
set DEVICE_NAME=Operator-Terminal
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
echo Device configured as: OPERATOR TERMINAL
echo Auto-login: ENABLED
echo.
echo To start the application, run: npm run desktop:dev
echo.
pause 