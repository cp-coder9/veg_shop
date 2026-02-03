const ftp = require("basic-ftp");

async function inspect() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "cp68.domains.co.za",
            user: "greg@ourharvesttote.store",
            password: "9876OurHarvestTote",
            secure: false // Try standard first, or true if it fails
        });
        console.log("Connected to FTP as greg");
        console.log("Root content:");
        const list = await client.list();
        console.log(list);

        // Search for public_html or similar
        const webRoot = list.find(f => f.name === 'public_html' || f.name === 'www' || f.name === 'httpdocs');
        if (webRoot) {
            console.log(`Potential web root: ${webRoot.name}`);

            const targetDir = "public_html/ourharvesttote.store";
            console.log(`Listing ${targetDir}:`);
            try {
                const files = await client.list(targetDir);
                console.log(files);
            } catch (e) {
                console.log(`Could not list ${targetDir}:`, e.message);
            }
        }
    }
    catch (err) {
        console.log("Error:", err);
    }
    client.close();
}

inspect();
