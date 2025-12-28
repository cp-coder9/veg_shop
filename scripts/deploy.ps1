#!/usr/bin/env pwsh
# One-Click Deployment Script for Organic Veg Shop
# This script automates building, testing, and preparing for Render.com deployment

param(
    [switch]$SkipTests,
    [switch]$Push,
    [string]$CommitMessage = "Deploy: Production build ready"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ORGANIC VEG SHOP - DEPLOYMENT SCRIPT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Navigate to project root
Set-Location $ProjectRoot

# Step 1: Install Dependencies
Write-Host "[1/6] Installing dependencies..." -ForegroundColor Yellow
npm install --workspaces --if-present 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "  > Dependencies installed" -ForegroundColor Green

# Step 2: Generate Prisma Client
Write-Host "[2/6] Generating Prisma client..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\backend"
npm run prisma:generate 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "  > Prisma client generated" -ForegroundColor Green

# Step 3: Build Backend
Write-Host "[3/6] Building backend..." -ForegroundColor Yellow
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  > Backend built successfully" -ForegroundColor Green

# Step 4: Build Frontend
Write-Host "[4/6] Building frontend..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  > Frontend built successfully" -ForegroundColor Green

# Step 5: Run Tests (optional)
if (-not $SkipTests) {
    Write-Host "[5/6] Running tests..." -ForegroundColor Yellow
    Set-Location "$ProjectRoot\backend"
    npm run test 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Some tests failed. Use -SkipTests to skip." -ForegroundColor Yellow
    } else {
        Write-Host "  > All tests passed" -ForegroundColor Green
    }
} else {
    Write-Host "[5/6] Skipping tests (use without -SkipTests to run)" -ForegroundColor Gray
}

# Step 6: Git Operations (if -Push flag)
Set-Location $ProjectRoot
if ($Push) {
    Write-Host "[6/6] Pushing to GitHub..." -ForegroundColor Yellow
    git add -A
    git commit -m $CommitMessage 2>&1 | Out-Null
    git push 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to push to GitHub" -ForegroundColor Red
        exit 1
    }
    Write-Host "  > Pushed to GitHub" -ForegroundColor Green
} else {
    Write-Host "[6/6] Skipping git push (use -Push to commit and push)" -ForegroundColor Gray
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT PREPARATION COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Push to GitHub (if not done): git add -A && git commit -m 'Deploy' && git push" -ForegroundColor Gray
Write-Host "  2. Go to Render Dashboard -> New -> Blueprint" -ForegroundColor Gray
Write-Host "  3. Connect your GitHub repository" -ForegroundColor Gray
Write-Host "  4. Set CORS_ORIGIN in Render to your Netlify URL" -ForegroundColor Gray
Write-Host "  5. Deploy frontend to Netlify with VITE_API_URL=<render-backend-url>" -ForegroundColor Gray
Write-Host ""
Write-Host "Optional flags:" -ForegroundColor White
Write-Host "  -SkipTests     Skip running tests" -ForegroundColor Gray
Write-Host "  -Push          Commit and push to GitHub" -ForegroundColor Gray
Write-Host "  -CommitMessage Specify custom commit message" -ForegroundColor Gray
Write-Host ""
