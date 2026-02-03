const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");

async function readEnv() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "cp68.domains.co.za",
            user: "greg@ourharvesttote.store",
            password: "9876OurHarvestTote",
            secure: false
        });
        console.log("Connected to FTP");

        await client.downloadTo("prod_env_backup", "/api/.env");
        const content = fs.readFileSync("prod_env_backup", "utf8");
        console.log("Remote .env content:");
        console.log(content);
        fs.unlinkSync("prod_env_backup");
    }
    catch (err) {
        console.log("Error:", err);
    }
    client.close();
}

readEnv();
