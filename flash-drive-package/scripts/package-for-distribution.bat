@echo off
echo Creating Distribution Package...
echo ================================

REM Create distribution folder
if not exist "distribution" mkdir distribution
cd distribution

REM Clean previous builds
if exist "gas-cylinder-dashboard" rmdir /s /q "gas-cylinder-dashboard"

REM Copy project files (excluding node_modules and git)
echo Copying project files...
xcopy /E /I /H /Y ".." "gas-cylinder-dashboard" /exclude:../scripts/exclude.txt

REM Create installation scripts for each role
echo Creating role-specific installers...

REM Operator installer
echo @echo off > gas-cylinder-dashboard\install-operator.bat
echo echo Installing Gas Cylinder Dashboard - Operator Terminal >> gas-cylinder-dashboard\install-operator.bat
echo set DEVICE_ROLE=operator >> gas-cylinder-dashboard\install-operator.bat
echo set DEVICE_NAME=Operator-Terminal >> gas-cylinder-dashboard\install-operator.bat
echo set AUTO_LOGIN=true >> gas-cylinder-dashboard\install-operator.bat
echo call install-base.bat >> gas-cylinder-dashboard\install-operator.bat

REM Manager installer  
echo @echo off > gas-cylinder-dashboard\install-manager.bat
echo echo Installing Gas Cylinder Dashboard - Manager Terminal >> gas-cylinder-dashboard\install-manager.bat
echo set DEVICE_ROLE=manager >> gas-cylinder-dashboard\install-manager.bat
echo set DEVICE_NAME=Manager-Terminal >> gas-cylinder-dashboard\install-manager.bat
echo set AUTO_LOGIN=true >> gas-cylinder-dashboard\install-manager.bat
echo call install-base.bat >> gas-cylinder-dashboard\install-manager.bat

REM Admin installer
echo @echo off > gas-cylinder-dashboard\install-admin.bat
echo echo Installing Gas Cylinder Dashboard - Admin Terminal >> gas-cylinder-dashboard\install-admin.bat
echo set DEVICE_ROLE=admin >> gas-cylinder-dashboard\install-admin.bat
echo set DEVICE_NAME=Admin-Terminal >> gas-cylinder-dashboard\install-admin.bat
echo set AUTO_LOGIN=true >> gas-cylinder-dashboard\install-admin.bat
echo call install-base.bat >> gas-cylinder-dashboard\install-base.bat

REM Base installer
echo @echo off > gas-cylinder-dashboard\install-base.bat
echo npm install >> gas-cylinder-dashboard\install-base.bat
echo npm run build >> gas-cylinder-dashboard\install-base.bat
echo cd electron >> gas-cylinder-dashboard\install-base.bat
echo npm install >> gas-cylinder-dashboard\install-base.bat
echo cd .. >> gas-cylinder-dashboard\install-base.bat
echo echo Installation complete! >> gas-cylinder-dashboard\install-base.bat
echo echo Starting application... >> gas-cylinder-dashboard\install-base.bat
echo npm run desktop:dev >> gas-cylinder-dashboard\install-base.bat

REM Create exclusion list
echo node_modules\ > gas-cylinder-dashboard\exclude.txt
echo .git\ >> gas-cylinder-dashboard\exclude.txt
echo dist\ >> gas-cylinder-dashboard\exclude.txt
echo *.log >> gas-cylinder-dashboard\exclude.txt

echo.
echo Distribution package created in 'distribution\gas-cylinder-dashboard'
echo.
echo To distribute:
echo 1. Copy 'distribution\gas-cylinder-dashboard' folder to flash drive
echo 2. On each computer, run the appropriate installer:
echo    - install-operator.bat (for operator terminals)
echo    - install-manager.bat (for manager terminals)  
echo    - install-admin.bat (for admin terminals)
echo.
pause 