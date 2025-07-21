@echo off
echo Creating Desktop Shortcuts...

REM Create shortcut for the current device role
set SHORTCUT_NAME="Gas Cylinder Dashboard"
set TARGET_PATH="%CD%\start-app.bat"

REM Create start-app.bat
echo @echo off > start-app.bat
echo cd /d "%~dp0" >> start-app.bat
echo npm run desktop:dev >> start-app.bat

REM Create desktop shortcut (requires PowerShell)
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Gas Cylinder Dashboard.lnk'); $Shortcut.TargetPath = '%CD%\start-app.bat'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.Save()"

echo Desktop shortcut created!
echo You can now double-click the shortcut to start the application.
pause 