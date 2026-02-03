import { Client } from 'basic-ftp';
import fs from 'fs';
import path from 'path';

async function upload() {
    const client = new Client();
    // client.ftp.verbose = true;

    // Hardcoded credentials based on task history
    const FTP_CONFIG = {
        host: "ftp.ourharvesttote.store",
        user: "greg@ourharvesttote.store",
        password: "9876OurHarvestTote",
        secure: false
    };

    try {
        console.log("Connecting to FTP...");
        await client.access(FTP_CONFIG);
        console.log("Connected!");

        const localPath = path.resolve('d:/veg_shop/backend-php/public/diag_mysql_remote.php');
        const remotePath = "/api/public/diag_mysql_remote.php"; // Corrected path based on upload_diag.js

        console.log(`Uploading ${localPath} to ${remotePath}...`);
        await client.uploadFrom(localPath, remotePath);

        console.log("Upload success!");
    } catch (err) {
        console.error("Upload failed:", err);
    } finally {
        client.close();
    }
}

upload();
