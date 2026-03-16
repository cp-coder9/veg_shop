# Simple FTP Upload for Organic Veg Shop
# Usage: Provide your FTP credentials when prompted

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FTP UPLOAD - Organic Veg Shop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get FTP credentials
$ftpHost = Read-Host "FTP Host (e.g., ftp.yourdomain.com)"
$ftpUser = Read-Host "FTP Username"
$ftpPass = Read-Host "FTP Password" -AsSecureString
$ftpPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($ftpPass))
$remotePath = Read-Host "Remote path (default: /public_html)"
if (-not $remotePath) { $remotePath = "/public_html" }

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$frontendDist = "$projectRoot\frontend\dist"

if (-not (Test-Path $frontendDist)) {
    Write-Host "ERROR: Frontend not built. Run 'npm run build' in frontend folder first." -ForegroundColor Red
    exit 1
}

Write-Host "`nUploading frontend files to ftp://$ftpHost$remotePath..." -ForegroundColor Yellow

# Use WebClient for FTP upload (more reliable than ftp.exe)
$webClient = New-Object System.Net.WebClient
$webClient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)

$files = Get-ChildItem -Path $frontendDist -Recurse -File
$total = $files.Count
$current = 0

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace($frontendDist, "").Replace("\", "/")
    if ($relativePath.StartsWith("/")) { $relativePath = $relativePath.Substring(1) }
    
    $remoteUri = "ftp://$ftpHost$remotePath/$relativePath"
    
    try {
        $webClient.UploadFile($remoteUri, "STOR", $file.FullName)
        $current++
        Write-Host "`rUploaded: $current / $total files" -NoNewline
    } catch {
        Write-Host "`nError uploading $($file.Name): $_" -ForegroundColor Red
    }
}

$webClient.Dispose()
Write-Host "`n`nUpload complete!" -ForegroundColor Green
Write-Host "Files uploaded to: $remotePath" -ForegroundColor Cyan
