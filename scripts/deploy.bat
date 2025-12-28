@echo off
REM One-Click Deployment Script for Organic Veg Shop
REM Run this file to build and prepare for deployment

echo.
echo ========================================
echo   ORGANIC VEG SHOP - ONE-CLICK DEPLOY
echo ========================================
echo.

cd /d "%~dp0.."

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*

pause
