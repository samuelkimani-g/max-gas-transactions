@echo off 
echo ======================================== 
echo   Installing ADMIN Terminal 
echo ======================================== 
echo. 
echo Installing dependencies... 
npm install 
echo Building application... 
npm run build 
echo Installing desktop app... 
cd electron 
npm install 
cd .. 
echo. 
echo ======================================== 
echo   ADMIN TERMINAL READY! 
echo ======================================== 
echo This terminal will auto-login as ADMIN 
echo Starting application... 
echo. 
npm run desktop:dev 
