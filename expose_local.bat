@echo off
set "BACKEND_SUBDOMAIN=veg-shop-backend-dev"
set "FRONTEND_SUBDOMAIN=veg-shop-frontend-dev"
set "BACKEND_URL=https://%BACKEND_SUBDOMAIN%.loca.lt"

echo ========================================================
echo   Organic Veg Shop - Remote Access Helper
echo ========================================================
echo.

echo 1. Starting Backend Tunnel (Port 3000)...
start "Backend Tunnel" cmd /k "cd backend && npx localtunnel --port 3000 --subdomain %BACKEND_SUBDOMAIN%"

echo 2. Starting Frontend Tunnel (Port 5173)...
start "Frontend Tunnel" cmd /k "cd frontend && npx localtunnel --port 5173 --subdomain %FRONTEND_SUBDOMAIN%"

echo 3. Updating .env configuration...
(
echo # Development Environment Configuration
echo # Copy this file to .env for local development
echo.
echo # Backend API URL (local development server^)
echo VITE_API_URL=%BACKEND_URL%/api
echo.
echo # Application Name
echo VITE_APP_NAME="Organic Veg Shop (Dev)"
echo.
echo # Enable debug mode
echo VITE_DEBUG=true
) > frontend/.env.development

echo.
echo ========================================================
echo   DONE!
echo ========================================================
echo.
echo IMPORTANT CHECKS:
echo 1. Look at the "Backend Tunnel" window.
echo    - If it says "your url is: %BACKEND_URL%", you are good!
echo    - If it gave you a RANDOM URL, the subdomain was taken.
echo      You must manually update frontend/.env.development with that random URL.
echo.
echo 2. RESTART YOUR FRONTEND SERVER:
echo    - Go to your running 'npx vite' terminal.
echo    - Press Ctrl+C, then run 'npx vite' again.
echo.
echo Frontend Access Link: https://%FRONTEND_SUBDOMAIN%.loca.lt
echo.
pause
