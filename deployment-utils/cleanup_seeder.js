const ftp = require("basic-ftp");

async function cleanup() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "cp68.domains.co.za",
            user: "greg@ourharvesttote.store",
            password: "9876OurHarvestTote",
            secure: false
        });
        console.log("Connected to FTP");

        await client.remove("/api/public/seed_users.php");
        console.log("Deleted seed_users.php from server.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.close();
    }
}

cleanup();
