const ftp = require("basic-ftp");
const path = require("path");

async function deploySeeder() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "cp68.domains.co.za",
            user: "greg@ourharvesttote.store",
            password: "9876OurHarvestTote",
            secure: false
        });
        console.log("Connected to FTP");

        // Upload seed_users.php to public
        await client.uploadFrom(
            "d:/veg_shop/backend-php/public/seed_users.php",
            "/api/public/seed_users.php"
        );

        console.log("Uploaded seed_users.php success!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.close();
    }
}

deploySeeder();
