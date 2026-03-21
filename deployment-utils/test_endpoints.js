const https = require('https');

const endpoints = [
    '/api/reports/dashboard',
    '/api/payments/stats',
    '/api/payments/recent',
    '/api/orders/window-status',
    '/api/availability/2026-03-23',
    '/api/stock-orders'
];

const host = 'ourharvesttote.store';
const adminToken = process.env.ADMIN_TOKEN; // Set this if authentication is needed, else we expect 401 Unauthorized, which is still better than 404!

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
                resolve({ path, statusCode: res.statusCode, data: data.substring(0, 100) });
            });
        });

        req.on('error', (e) => {
            resolve({ path, error: e.message });
        });

        req.end();
    });
}

async function runAll() {
    console.log('Testing missing API routes on production...');
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        console.log(`[${result.statusCode || 'ERR'}] ${result.path}`);
        if (result.statusCode !== 200 && result.statusCode !== 401 && result.statusCode !== 403) {
            console.log(`   -> Data: ${result.data}`);
        } else if (result.statusCode === 200) {
            console.log(`   -> Success! snippet: ${result.data}`);
        } else {
            console.log(`   -> Auth required, but endpoint exists (Status ${result.statusCode})`);
        }
    }
}

runAll();
