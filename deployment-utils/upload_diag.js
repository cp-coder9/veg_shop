const ftp = require("basic-ftp");
const path = require("path");

async function upload() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "cp68.domains.co.za",
            user: "greg@ourharvesttote.store",
            password: "9876OurHarvestTote",
            secure: false
        });
        console.log("Connected to FTP");

        await client.uploadFrom(
            "d:/veg_shop/backend-php/public/diag.php",
            "/api/public/diag.php"
        );
        console.log("Uploaded diag.php");

        // Keep .env updated just in case
        const envContent = `DB_HOST=localhost
DB_PORT=3306
DB_NAME=ourharve_veg_db
DB_USER=prepedb1
DB_PASS=9876OurHarvestTote

JWT_SECRET=Eaos8zf6jittn82oXZuWZ4JBUOAuGKorM0yPeUPbNZk=
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800

APP_ENV=production
APP_DEBUG=true
APP_URL=https://ourharvesttote.store

CORS_ORIGIN=https://ourharvesttote.store

FIREBASE_PROJECT_ID=our-harvest-tote
FIREBASE_API_KEY=AIzaSyCeBDhY7SOvsmfcTmxi5Ra-qOZGtLrJApM

SMTP_HOST=mail.ourharvesttote.store
SMTP_PORT=465
SMTP_USER=greg@ourharvesttote.store
SMTP_PASS=9876OurHarvestTote
SMTP_FROM_EMAIL=greg@ourharvesttote.store
SMTP_FROM_NAME="Our Harvest Tote"`;

        const fs = require('fs');
        fs.writeFileSync('temp_env', envContent);
        await client.uploadFrom('temp_env', '/api/.env');
        fs.unlinkSync('temp_env');
        console.log("Uploaded .env");

    } catch (err) {
        console.error("Error:", err);
    }
    client.close();
}

upload();
