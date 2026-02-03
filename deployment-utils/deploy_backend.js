const ftp = require("basic-ftp");
const path = require("path");

async function deployBackend() {
    const client = new ftp.Client();
    // client.ftp.verbose = true;
    try {
        await client.access({
            host: "cp68.domains.co.za",
            user: "greg@ourharvesttote.store",
            password: "9876OurHarvestTote",
            secure: false
        });
        console.log("Connected to FTP");

        // Upload Source Files
        const localSrc = path.resolve("d:/veg_shop/backend-php/src");
        const remoteSrc = "/api/src";

        console.log(`Uploading ${localSrc} to ${remoteSrc}...`);
        await client.ensureDir(remoteSrc);
        await client.uploadFromDir(localSrc, remoteSrc);

        // Upload Public Files (index.php etc) - excluding htaccess if needed? 
        // Actually usually index.php is in public so let's check structure.
        // Based on previous logs, public/index.php maps to /api/index.php or similar?
        // Let's assume standard structure for now or just upload src first.

        console.log("Backend upload success!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.close();
    }
}

deployBackend();
