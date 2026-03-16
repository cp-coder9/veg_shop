#!/usr/bin/env pwsh
# FTP Upload Script for Organic Veg Shop
# Usage: .\ftp-upload.ps1 -Host <ftp_host> -User <username> -Pass <password> -RemotePath <remote_directory>

param(
    [Parameter(Mandatory=$true)]
    [string]$Host,
    
    [Parameter(Mandatory=$true)]
    [string]$User,
    
    [Parameter(Mandatory=$true)]
    [string]$Pass,
    
    [string]$RemotePath = "/public_html",
    
    [switch]$UploadBackend
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FTP UPLOAD - Organic Veg Shop" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Determine what to upload
$FrontendDist = "$ProjectRoot\frontend\dist"
$BackendDist = "$ProjectRoot\backend\dist"
$BackendPHP = "$ProjectRoot\backend-php"

if (-not (Test-Path $FrontendDist)) {
    Write-Host "ERROR: Frontend dist folder not found. Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Create FTP script file
$FTPScript = "$env:TEMP\ftp_commands_$PID.txt"
$UploadLog = "$env:TEMP\ftp_upload_$PID.log"

# Build FTP commands
@"
open $Host
$User
$Pass
cd $RemotePath
binary
prompt off
"@ | Out-File -FilePath $FTPScript -Encoding ASCII

Write-Host "[1/3] Uploading frontend (static files)..." -ForegroundColor Yellow

# Upload frontend files
$FrontendFiles = Get-ChildItem -Path $FrontendDist -Recurse -File
$TotalFiles = $FrontendFiles.Count
$Uploaded = 0

foreach ($file in $FrontendFiles) {
    $relativePath = $file.FullName.Replace($FrontendDist, "").Replace("\", "/")
    if ($relativePath -match "^/(.*)") {
        $relativePath = $matches[1]
    }
    if ($relativePath -match "^/(.*)") {
        $relativePath = $matches[1]
    }
    if ($relativePath -eq "index.html") {
        $relativePath = ""
    }
    
    $remoteDir = Split-Path $relativePath -Parent
    if ($remoteDir -ne "" -and $remoteDir -ne "/") {
        "cd $RemotePath/$remoteDir" | Out-File -FilePath $FTPScript -Append -Encoding ASCII
    }
    
    $remoteFile = if ($relativePath) { "$RemotePath/$relativePath" } else { "$RemotePath/index.html" }
    "put `"$($file.FullName)`" `"$remoteFile`"" | Out-File -FilePath $FTPScript -Append -Encoding ASCII
    
    $Uploaded++
    Write-Host "`r  Uploaded: $Uploaded / $TotalFiles" -NoNewline
}

Write-Host "`n  > Frontend uploaded successfully" -ForegroundColor Green

# Upload backend if requested
if ($UploadBackend) {
    Write-Host "[2/3] Uploading backend (Node.js)..." -ForegroundColor Yellow
    
    if (Test-Path $BackendDist) {
        "cd $RemotePath" | Out-File -FilePath $FTPScript -Append -Encoding ASCII
        "mkdir backend" | Out-File -FilePath $FTPScript -Append -Encoding ASCII
        "cd backend" | Out-File -FilePath $FTPScript -Append -Encoding ASCII
        
        $BackendFiles = Get-ChildItem -Path $BackendDist -Recurse -File
        foreach ($file in $BackendFiles) {
            $relativePath = $file.FullName.Replace($BackendDist, "").Replace("\", "/")
            if ($relativePath -match "^/(.*)") {
                $relativePath = $matches[1]
            }
            
            $remoteDir = Split-Path $relativePath -Parent
            if ($remoteDir -ne "" -and $remoteDir -ne "/") {
                "mkdir $remoteDir" | Out-File -FilePath $FTPScript -Append -Encoding ASCII
                "cd $remoteDir" | Out-File -FilePath $FTPScript -Append -Encoding ASCII
            }
            
            "put `"$($file.FullName)`" `"$relativePath`"" | Out-File -FilePath $FTPScript -Append -Encoding ASCII
        }
        
        Write-Host "  > Backend uploaded successfully" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Backend dist folder not found. Run 'npm run build' in backend." -ForegroundColor Yellow
    }
} else {
    Write-Host "[2/3] Skipping backend upload (use -UploadBackend to upload)" -ForegroundColor Gray
}

# Close FTP
"bye" | Out-File -FilePath $FTPScript -Append -Encoding ASCII

Write-Host "[3/3] Connecting to FTP server..." -ForegroundColor Yellow

# Run FTP command
$ftpResult = ftp -s:$FTPScript 2>&1

# Cleanup
Remove-Item $FTPScript -ErrorAction SilentlyContinue

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  UPLOAD COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Configure your server (database, environment variables)" -ForegroundColor Gray
Write-Host "  2. Point your domain to the public directory" -ForegroundColor Gray
Write-Host "  3. For Node.js backend: Run 'pm2 start dist/index.js' on server" -ForegroundColor Gray
