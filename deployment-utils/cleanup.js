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
        console.log("Connected to FTP as greg");

        const toDelete = ["probe_greg.txt", "db_verify.php", "probe_path_3.txt", "probe_final.txt"];
        for (const file of toDelete) {
            try {
                await client.remove(file);
                console.log(`Deleted ${file}`);
            } catch (e) { }
        }

        try {
            await client.removeDir("sasha");
            console.log("Deleted sasha directory");
        } catch (e) { }

    } catch (e) {
        console.log(e);
    }
    client.close();
}
cleanup();
