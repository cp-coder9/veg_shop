const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");

async function deploy() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "cp68.domains.co.za",
            user: "greg@ourharvesttote.store",
            password: "9876OurHarvestTote",
            secure: false
        });
        console.log("Connected to FTP as greg");

        // 0. Cleanup - optional, but good for clean slate
        // await client.clearWorkingDir(); 

        // 1. Upload Frontend
        console.log("Uploading frontend to ROOT...");
        await client.uploadFromDir(path.join(__dirname, "../frontend/dist"), "/");
        console.log("Frontend uploaded.");

        // 1.1 Create Frontend .htaccess for SPA routing
        const frontendHtaccess = `RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]`;
        const fHtaccessPath = path.join(__dirname, "frontend_htaccess");
        fs.writeFileSync(fHtaccessPath, frontendHtaccess);
        await client.uploadFrom(fHtaccessPath, "/.htaccess");
        fs.unlinkSync(fHtaccessPath);
        console.log("Frontend .htaccess uploaded.");

        // 2. Upload Backend
        console.log("Ensuring /api exists...");
        await client.ensureDir("/api");

        const backendFolders = ["src", "vendor", "database", "public"];
        for (const folder of backendFolders) {
            console.log(`Uploading ${folder}...`);
            await client.uploadFromDir(path.join(__dirname, `../backend-php/${folder}`), `/api/${folder}`);
        }

        const backendFiles = ["composer.json", "composer.lock", "README.md"];
        for (const file of backendFiles) {
            await client.uploadFrom(path.join(__dirname, `../backend-php/${file}`), `/api/${file}`);
        }

        // 3. Create .htaccess for routing
        const htaccessContent = `RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ public/index.php [QSA,L]`;
        const htaccessPath = path.join(__dirname, "api_htaccess");
        fs.writeFileSync(htaccessPath, htaccessContent);
        await client.uploadFrom(htaccessPath, "/api/.htaccess");
        fs.unlinkSync(htaccessPath);

        // 4. Create .env with production credentials
        const envContent = `DB_HOST=localhost
DB_PORT=3306
DB_NAME=ourharve_veg_db
DB_USER=prepedb1
DB_PASS=9876OurHarvestTote

JWT_SECRET=Eaos8zf6jittn82oXZuWZ4JBUOAuGKorM0yPeUPbNZk=
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800

APP_ENV=production
APP_DEBUG=false
APP_URL=https://ourharvesttote.store

CORS_ORIGIN=https://ourharvesttote.store

# Firebase Configuration
FIREBASE_PROJECT_ID=our-harvest-tote
FIREBASE_API_KEY=AIzaSyCeBDhY7SOvsmfcTmxi5Ra-qOZGtLrJApM

# SMTP Configuration
SMTP_HOST=mail.ourharvesttote.store
SMTP_PORT=465
SMTP_USER=greg@ourharvesttote.store
SMTP_PASS=9876OurHarvestTote
SMTP_FROM_EMAIL=greg@ourharvesttote.store
SMTP_FROM_NAME="Our Harvest Tote"`;
        const envPath = path.join(__dirname, "prod_env");
        fs.writeFileSync(envPath, envContent);
        await client.uploadFrom(envPath, "/api/.env");
        fs.unlinkSync(envPath);

        console.log("Deployment complete!");
    }
    catch (err) {
        console.log("Error:", err);
    }
    client.close();
}

deploy();
