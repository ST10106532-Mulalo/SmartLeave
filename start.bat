@echo off 
title SmartLeave - Enterprise Leave Management System 
color 0A 
echo ======================================== 
echo    SMARTLEAVE - STARTING SYSTEM 
echo ======================================== 
echo. 
echo [1/3] Starting Backend Server... 
cd SmartLeaveAPI 
start "SmartLeave Backend" cmd /k "dotnet run" 
cd .. 
timeout /t 5 /nobreak >nul 
echo [2/3] Starting Frontend Application... 
cd frontend 
start "SmartLeave Frontend" cmd /k "ng serve" 
cd .. 
echo. 
echo ======================================== 
echo    SYSTEM IS RUNNING! 
echo ======================================== 
echo. 
echo Backend API:  http://localhost:5298 
echo Frontend App: http://localhost:4200 
echo. 
echo Admin Login: admin@company.com 
echo Password: 12345678910 
echo. 
echo To stop: Close all command prompt windows 
echo. 
pause 
