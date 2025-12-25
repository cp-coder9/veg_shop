#!/usr/bin/env node
/**
 * Deployment Automation Script
 * Run: node scripts/deploy.js
 * 
 * This script:
 * 1. Generates secure secrets
 * 2. Validates the project structure
 * 3. Commits and pushes to GitHub
 * 4. Provides deployment instructions
 */

import { execSync } from 'child_process';
import { randomBytes } from 'crypto';
import { existsSync } from 'fs';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
    try {
        return execSync(command, { encoding: 'utf8', ...options });
    } catch (error) {
        return null;
    }
}

async function main() {
    log('\n🚀 Organic Veg Order System - Deployment Script\n', 'blue');

    // Step 1: Validate project structure
    log('1️⃣  Validating project structure...', 'yellow');
    const requiredFiles = [
        'render.yaml',
        'frontend/netlify.toml',
        'backend/package.json',
        'frontend/package.json',
    ];

    for (const file of requiredFiles) {
        if (!existsSync(file)) {
            log(`   ❌ Missing: ${file}`, 'red');
            process.exit(1);
        }
        log(`   ✅ ${file}`, 'green');
    }

    // Step 2: Generate secrets
    log('\n2️⃣  Generating secure secrets...', 'yellow');
    const jwtSecret = randomBytes(64).toString('hex');
    log(`   JWT_SECRET: ${jwtSecret.substring(0, 20)}...`, 'green');

    // Step 3: Check Git status
    log('\n3️⃣  Checking Git status...', 'yellow');
    const gitStatus = exec('git status --porcelain');
    if (gitStatus && gitStatus.trim()) {
        log('   Uncommitted changes detected. Committing...', 'yellow');
        exec('git add .');
        exec('git commit -m "Prepare for deployment"');
        log('   ✅ Changes committed', 'green');
    } else {
        log('   ✅ No uncommitted changes', 'green');
    }

    // Step 4: Check remote
    log('\n4️⃣  Checking GitHub remote...', 'yellow');
    const remotes = exec('git remote -v');
    if (!remotes || !remotes.includes('origin')) {
        log('   ⚠️  No GitHub remote found. Add one with:', 'yellow');
        log('   git remote add origin https://github.com/your-username/veg_shop.git', 'blue');
    } else {
        log('   ✅ GitHub remote configured', 'green');
    }

    // Step 5: Push to GitHub
    log('\n5️⃣  Pushing to GitHub...', 'yellow');
    const pushResult = exec('git push origin main 2>&1');
    if (pushResult) {
        log('   ✅ Pushed to GitHub', 'green');
    } else {
        log('   ⚠️  Push failed. You may need to set up the remote first.', 'yellow');
    }

    // Step 6: Print deployment instructions
    log('\n' + '='.repeat(60), 'blue');
    log('📋 DEPLOYMENT INSTRUCTIONS', 'blue');
    log('='.repeat(60), 'blue');

    log('\n🔹 BACKEND (Render.com):', 'yellow');
    log('   1. Go to https://dashboard.render.com', 'reset');
    log('   2. Click "New +" → "Blueprint"', 'reset');
    log('   3. Connect your GitHub repo', 'reset');
    log('   4. Render will auto-detect render.yaml', 'reset');
    log('   5. Click "Apply" to create services', 'reset');
    log('   6. After deploy, set these in Environment tab:', 'reset');
    log('      - CORS_ORIGIN = https://your-app.netlify.app', 'reset');
    log('      - WHATSAPP_* (optional)', 'reset');
    log('      - SENDGRID_* (optional)', 'reset');

    log('\n🔹 FRONTEND (Netlify):', 'yellow');
    log('   1. Go to https://app.netlify.com', 'reset');
    log('   2. Click "Add new site" → "Import an existing project"', 'reset');
    log('   3. Connect GitHub and select your repo', 'reset');
    log('   4. Set these build settings:', 'reset');
    log('      - Base directory: frontend', 'reset');
    log('      - Build command: npm run build', 'reset');
    log('      - Publish directory: frontend/dist', 'reset');
    log('   5. Add environment variable:', 'reset');
    log('      - VITE_API_URL = https://organic-veg-api.onrender.com/api', 'reset');

    log('\n✨ After both are deployed, update:', 'green');
    log('   - Render: CORS_ORIGIN → your Netlify URL', 'reset');
    log('   - Netlify: VITE_API_URL → your Render URL', 'reset');

    log('\n' + '='.repeat(60) + '\n', 'blue');
}

main().catch(console.error);
