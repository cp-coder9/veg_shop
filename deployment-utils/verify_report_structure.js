const https = require('https');

const endpoints = [
    '/api/reports/dashboard',
    '/api/reports/sales',
    '/api/reports/payments',
    '/api/reports/products',
    '/api/reports/customers'
];

const host = 'ourharvesttote.store';
const adminToken = process.env.ADMIN_TOKEN;

async function testEndpoint(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: host,
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken || 'dummy'}`,
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ path, statusCode: res.statusCode, data: data });
            });
        });

        req.on('error', (e) => {
            resolve({ path, error: e.message });
        });

        req.end();
    });
}

async function runAll() {
    console.log('Verifying Report API response structures on production...');
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        console.log(`[${result.statusCode}] ${result.path}`);
        if (result.statusCode === 200) {
            try {
                const json = JSON.parse(result.data);
                if (endpoint === '/api/reports/sales') {
                    console.log('   -> Sales Report Keys:', Object.keys(json));
                    console.log('   -> ProductsSold:', json.productsSold ? 'Found' : 'MISSING!');
                    if (json.productsSold && json.productsSold.length > 0) {
                        console.log('   -> Sample ProductSold Keys:', Object.keys(json.productsSold[0]));
                    }
                } else {
                    console.log('   -> Keys:', Object.keys(json));
                }
            } catch (e) {
                console.log('   -> Failed to parse JSON:', result.data.substring(0, 100));
            }
        } else {
            console.log(`   -> Error response: ${result.data.substring(0, 50)}`);
        }
    }
}

runAll();
