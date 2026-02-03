$ErrorActionPreference = "Stop"

# Candidate URLs - trying newest first, falling back to older known-good archived versions
$candidateUrls = @(
    "https://windows.php.net/downloads/releases/php-8.4.3-nts-Win32-vs17-x64.zip",
    "https://windows.php.net/downloads/releases/php-8.3.16-nts-Win32-vs16-x64.zip",
    "https://windows.php.net/downloads/releases/archives/php-8.3.15-nts-Win32-vs16-x64.zip",
    "https://windows.php.net/downloads/releases/archives/php-8.2.14-nts-Win32-vs16-x64.zip"
)
$composerUrl = "https://getcomposer.org/composer.phar"
$installDir = "$PSScriptRoot\..\bin\php"
$composerDir = "$PSScriptRoot\..\bin"

# Create directories
if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
}
if (!(Test-Path $composerDir)) {
    New-Item -ItemType Directory -Force -Path $composerDir | Out-Null
}

# Download PHP with fallback logic
$zipPath = "$installDir\php.zip"
$downloaded = $false

foreach ($url in $candidateUrls) {
    Write-Host "Attempting download: $url"
    try {
        Invoke-WebRequest -Uri $url -OutFile $zipPath
        $downloaded = $true
        Write-Host "Success!"
        break
    }
    catch {
        Write-Warning "Failed to download from $url : $($_.Exception.Message)"
    }
}

if (-not $downloaded) {
    throw "Fatal: Could not download PHP from any of the candidate URLs."
}

# Extract PHP
Write-Host "Extracting PHP..."
if (Test-Path "$installDir\php.exe") {
    Write-Host "PHP already extracted. Skipping."
}
else {
    Expand-Archive -Path $zipPath -DestinationPath $installDir -Force
    Remove-Item $zipPath
}

# Configure php.ini
Write-Host "Configuring php.ini..."
$iniFile = "$installDir\php.ini"
if (!(Test-Path $iniFile)) {
    Copy-Item "$installDir\php.ini-development" $iniFile
    $iniContent = Get-Content $iniFile
    
    # Enable common extensions
    $iniContent = $iniContent -replace ';extension_dir = "ext"', 'extension_dir = "ext"'
    $iniContent = $iniContent -replace ';extension=curl', 'extension=curl'
    $iniContent = $iniContent -replace ';extension=mbstring', 'extension=mbstring'
    $iniContent = $iniContent -replace ';extension=openssl', 'extension=openssl'
    $iniContent = $iniContent -replace ';extension=pdo_mysql', 'extension=pdo_mysql'
    $iniContent = $iniContent -replace ';extension=fileinfo', 'extension=fileinfo'
    $iniContent = $iniContent -replace ';extension=mysqli', 'extension=mysqli'
    
    Set-Content $iniFile $iniContent
}

# Download Composer
Write-Host "Downloading Composer..."
Invoke-WebRequest -Uri $composerUrl -OutFile "$composerDir\composer.phar"

# Create composer.bat
$batContent = "@echo off`r`n""$installDir\php.exe"" ""$composerDir\composer.phar"" %*"
Set-Content "$composerDir\composer.bat" $batContent

Write-Host "PHP and Composer installed successfully in $installDir"
