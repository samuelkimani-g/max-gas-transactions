@echo off
echo ========================================
echo   Gas Cylinder Dashboard - Flash Drive Package
echo ========================================

REM Create distribution folder
echo Creating distribution folder...
if not exist "flash-drive-package" mkdir "flash-drive-package"

REM Copy essential files
echo Copying project files...
robocopy . "flash-drive-package" /E /XD node_modules .git dist electron\node_modules electron\dist backend\node_modules .vercel /XF *.log

REM Create simple installer scripts
echo Creating installer scripts...

REM Operator installer
echo @echo off > "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo   Installing OPERATOR Terminal >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo. >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo Installing dependencies... >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo npm install >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo Building application... >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo npm run build >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo Installing desktop app... >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo cd electron >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo npm install >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo cd .. >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo. >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo   OPERATOR TERMINAL READY! >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo This terminal will auto-login as OPERATOR >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo Starting application... >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo echo. >> "flash-drive-package\INSTALL-OPERATOR.bat"
echo npm run desktop:dev >> "flash-drive-package\INSTALL-OPERATOR.bat"

REM Manager installer
echo @echo off > "flash-drive-package\INSTALL-MANAGER.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo   Installing MANAGER Terminal >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo. >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo Installing dependencies... >> "flash-drive-package\INSTALL-MANAGER.bat"
echo npm install >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo Building application... >> "flash-drive-package\INSTALL-MANAGER.bat"
echo npm run build >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo Installing desktop app... >> "flash-drive-package\INSTALL-MANAGER.bat"
echo cd electron >> "flash-drive-package\INSTALL-MANAGER.bat"
echo npm install >> "flash-drive-package\INSTALL-MANAGER.bat"
echo cd .. >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo. >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo   MANAGER TERMINAL READY! >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo This terminal will auto-login as MANAGER >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo Starting application... >> "flash-drive-package\INSTALL-MANAGER.bat"
echo echo. >> "flash-drive-package\INSTALL-MANAGER.bat"
echo npm run desktop:dev >> "flash-drive-package\INSTALL-MANAGER.bat"

REM Admin installer
echo @echo off > "flash-drive-package\INSTALL-ADMIN.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo   Installing ADMIN Terminal >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo. >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo Installing dependencies... >> "flash-drive-package\INSTALL-ADMIN.bat"
echo npm install >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo Building application... >> "flash-drive-package\INSTALL-ADMIN.bat"
echo npm run build >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo Installing desktop app... >> "flash-drive-package\INSTALL-ADMIN.bat"
echo cd electron >> "flash-drive-package\INSTALL-ADMIN.bat"
echo npm install >> "flash-drive-package\INSTALL-ADMIN.bat"
echo cd .. >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo. >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo   ADMIN TERMINAL READY! >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo ======================================== >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo This terminal will auto-login as ADMIN >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo Starting application... >> "flash-drive-package\INSTALL-ADMIN.bat"
echo echo. >> "flash-drive-package\INSTALL-ADMIN.bat"
echo npm run desktop:dev >> "flash-drive-package\INSTALL-ADMIN.bat"

REM Create README for distribution
echo ======================================== > "flash-drive-package\README.txt"
echo   Gas Cylinder Dashboard - Installation >> "flash-drive-package\README.txt"
echo ======================================== >> "flash-drive-package\README.txt"
echo. >> "flash-drive-package\README.txt"
echo REQUIREMENTS: >> "flash-drive-package\README.txt"
echo - Windows 10/11 >> "flash-drive-package\README.txt"
echo - Node.js 18+ installed >> "flash-drive-package\README.txt"
echo - Internet connection >> "flash-drive-package\README.txt"
echo. >> "flash-drive-package\README.txt"
echo INSTALLATION: >> "flash-drive-package\README.txt"
echo 1. Copy this entire folder to each computer >> "flash-drive-package\README.txt"
echo 2. Run the appropriate installer: >> "flash-drive-package\README.txt"
echo    - INSTALL-OPERATOR.bat  (for data entry staff) >> "flash-drive-package\README.txt"
echo    - INSTALL-MANAGER.bat   (for supervisors) >> "flash-drive-package\README.txt"
echo    - INSTALL-ADMIN.bat     (for administrators) >> "flash-drive-package\README.txt"
echo. >> "flash-drive-package\README.txt"
echo FEATURES: >> "flash-drive-package\README.txt"
echo - Auto-login based on terminal type >> "flash-drive-package\README.txt"
echo - Real-time data sync across all devices >> "flash-drive-package\README.txt"
echo - Works with web version at: https://max-gas-transactions.vercel.app >> "flash-drive-package\README.txt"
echo - Offline support with auto-sync when online >> "flash-drive-package\README.txt"
echo. >> "flash-drive-package\README.txt"
echo SUPPORT: >> "flash-drive-package\README.txt"
echo Backend: https://max-gas-backend.onrender.com >> "flash-drive-package\README.txt"
echo Web App: https://max-gas-transactions.vercel.app >> "flash-drive-package\README.txt"

echo.
echo ========================================
echo   FLASH DRIVE PACKAGE CREATED!
echo ========================================
echo.
echo Package location: flash-drive-package\
echo.
echo NEXT STEPS:
echo 1. Copy 'flash-drive-package' folder to your flash drive
echo 2. Take flash drive to each computer
echo 3. Copy folder to computer's desktop
echo 4. Run appropriate installer:
echo    - INSTALL-OPERATOR.bat  (Operator terminals)
echo    - INSTALL-MANAGER.bat   (Manager terminals)
echo    - INSTALL-ADMIN.bat     (Admin terminals)
echo.
echo Each computer will auto-login with its role!
echo All data syncs in real-time across all devices!
echo.
pause 