@echo off
REM FTP Upload Script for Organic Veg Shop
REM Usage: ftp-upload.bat [ftp_host] [username] [password] [remote_path]
REM Example: ftp-upload.bat ftp.example.com myuser mypass /public_html

if "%1"=="" goto :prompt
if "%2"=="" goto :prompt
if "%3"=="" goto :prompt

set FTP_HOST=%1
set FTP_USER=%2
set FTP_PASS=%3
set REMOTE_PATH=%4
if "%REMOTE_PATH%"=="" set REMOTE_PATH=/public_html

goto :upload

:prompt
echo.
echo ========================================
echo   FTP Upload - Organic Veg Shop
echo ========================================
echo.
echo Usage: ftp-upload.bat [ftp_host] [username] [password] [remote_path]
echo.
echo Example: ftp-upload.bat ftp.example.com myuser mypass /public_html
echo.
goto :end

:upload
echo.
echo ========================================
echo   Uploading to FTP: %FTP_HOST%
echo ========================================
echo.

cd /d "%~dp0.."

if not exist "frontend\dist" (
    echo ERROR: Frontend not built. Run 'npm run build' first.
    goto :end
)

echo Uploading frontend files...

REM Upload index.html
curl -T frontend\dist\index.html ftp://%FTP_HOST%%REMOTE_PATH%/ --user %FTP_USER%:%FTP_PASS% -v

REM Upload assets folder
for /r "frontend\dist\assets" %%f in (*) do (
    set "relpath=%%~nf"
    set "relpath=!relpath:frontend\dist\=!"
    curl -T "%%f" ftp://%FTP_HOST%%REMOTE_PATH%/!relpath! --user %FTP_USER%:%FTP_PASS% -v
)

echo.
echo ========================================
echo   Upload Complete!
echo ========================================
echo.
echo Files uploaded to: %REMOTE_PATH%
echo.

:end
pause
