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
            "/api/public/diag_v3.php"
        );
        console.log("Uploaded diag_v3.php");

    } catch (err) {
        console.error("Error:", err);
    }
    client.close();
}

upload();
