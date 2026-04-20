const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");

async function deployFrontend() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "cp68.domains.co.za",
            user: "greg@ourharvesttote.store",
            password: "9876OurHarvestTote",
            secure: false
        });
        console.log("Connected to FTP as greg");

        const remoteRoot = "/";

        // 1. Upload Frontend dist
        console.log("Uploading frontend to ROOT...");
        await client.uploadFromDir(path.join(__dirname, "../frontend/dist"), remoteRoot);
        console.log("Frontend uploaded.");

        // 2. Create Frontend .htaccess for SPA routing
        const frontendHtaccess = `RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]`;
        const fHtaccessPath = path.join(__dirname, "frontend_htaccess");
        fs.writeFileSync(fHtaccessPath, frontendHtaccess);
        await client.uploadFrom(fHtaccessPath, `${remoteRoot}/.htaccess`);
        fs.unlinkSync(fHtaccessPath);
        console.log("Frontend .htaccess uploaded.");

        // 3. Upload Firebase runtime config
        const firebaseConfigContent = `window.__FIREBASE_CONFIG__ = {
  apiKey: "AIzaSyCeBDhY7SOvsmfcTmxi5Ra-qOZGtLrJApM",
  authDomain: "our-harvest-tote.firebaseapp.com",
  databaseURL: "https://our-harvest-tote-default-rtdb.firebaseio.com",
  projectId: "our-harvest-tote",
  storageBucket: "our-harvest-tote.firebasestorage.app",
  messagingSenderId: "703119370454",
  appId: "1:703119370454:web:e27f87706d213ff30d4177",
  measurementId: "G-YEVS64C84N"
};`;
        const firebaseConfigPath = path.join(__dirname, "firebase-config.js");
        fs.writeFileSync(firebaseConfigPath, firebaseConfigContent);
        await client.uploadFrom(firebaseConfigPath, `${remoteRoot}/firebase-config.js`);
        fs.unlinkSync(firebaseConfigPath);
        console.log("Frontend Firebase config uploaded.");

        console.log("Frontend deployment complete!");
    }
    catch (err) {
        console.log("Error:", err);
    }
    client.close();
}

deployFrontend();
