const ftp = require("basic-ftp");
const fs = require("fs");

async function probe() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "cp68.domains.co.za",
            user: "greg@ourharvesttote.store",
            password: "9876OurHarvestTote",
            secure: false
        });
        console.log("Connected to FTP as greg");
        console.log("Current Directory: " + await client.pwd());

        console.log("Listing root:");
        console.log(await client.list());

        fs.writeFileSync("probe_greg.txt", "Hello from Greg");
        console.log("Uploading probe_greg.txt to / ...");
        await client.uploadFrom("probe_greg.txt", "probe_greg.txt");

        console.log("Probe uploaded.");
    }
    catch (err) {
        console.log("Error:", err);
    }
    client.close();
}

probe();
