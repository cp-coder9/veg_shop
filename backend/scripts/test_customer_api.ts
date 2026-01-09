
import axios from 'axios';

const API_URL = 'http://127.0.0.1:3000/api';

async function main() {
    try {
        // 1. Login as Admin
        console.log('Logging in...');
        // We recently seeded 'admin@vegshop.com' as admin
        const loginRes = await axios.post(`${API_URL}/auth/dev-login`, {
            email: 'admin@vegshop.com'
        });

        const connection = loginRes.data;
        const token = connection.accessToken || connection.token;
        console.log('Got token:', token ? 'YES' : 'NO');

        // 2. Fetch Customers
        console.log('Fetching Customers...');
        const customerRes = await axios.get(`${API_URL}/customers`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Response Status:', customerRes.status);
        console.log('Customers Found:', customerRes.data.length);
        console.log('First Customer:', JSON.stringify(customerRes.data[0], null, 2));

    } catch (error: any) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

main();
