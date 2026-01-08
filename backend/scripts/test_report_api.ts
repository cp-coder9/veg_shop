
import axios from 'axios';

const API_URL = 'http://127.0.0.1:3000/api';

async function main() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/dev-login`, {
            email: 'admin@vegshop.com'
        });
        const token = loginRes.data.token;
        console.log('Got token:', token ? 'YES' : 'NO');

        // 2. Fetch Report
        console.log('Fetching Sales Report...');
        const reportRes = await axios.get(`${API_URL}/reports/sales`, {
            params: {
                startDate: '2024-01-01',
                endDate: '2030-01-01'
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Report Response:', JSON.stringify(reportRes.data, null, 2));

    } catch (error) {
        console.error('Error:', (error as any).response ? (error as any).response.data : (error as any).message);
    }
}

main();
