const ftp = require("basic-ftp");

async function checkHtaccess() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "cp68.domains.co.za",
            user: "sasha@ourharvesttote.store",
            password: "9876OurHarvestTote",
            secure: false
        });
        console.log("Connected to FTP");

        console.log("Listing public_html:");
        const list = await client.list("public_html");
        list.forEach(f => console.log(`- ${f.name}`));

        const htaccess = list.find(f => f.name === ".htaccess");
        if (htaccess) {
            console.log("\nFOUND .htaccess in public_html!");
        } else {
            console.log("\nMISSING .htaccess in public_html");
        }

    } catch (e) {
        console.log(e);
    }
    client.close();
}
checkHtaccess();
