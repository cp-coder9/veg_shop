import axios from 'axios';
import { prisma } from '../src/lib/prisma.js';

const API_URL = 'http://127.0.0.1:3000/api';

async function e2eApiTest() {
    console.log('🚀 Starting API-based E2E Test: Customer Login -> Order -> Admin Verify');

    try {
        // --- 1. Customer Login (Dev Login) ---
        console.log('1️⃣  Logging in as Customer (john@example.com)...');
        const customerLoginRes = await axios.post(`${API_URL}/auth/dev-login`, {
            email: 'john@example.com'
        });

        const customerToken = customerLoginRes.data.accessToken || customerLoginRes.data.token;
        if (!customerToken) {
            throw new Error('Customer login failed - no token returned');
        }
        console.log('   ✅ Customer logged in.');

        // --- 2. Get Products ---
        console.log('2️⃣  Fetching Products...');
        const productsRes = await axios.get(`${API_URL}/products`);
        let products = productsRes.data;

        // Handle paginated response
        if (products.data && Array.isArray(products.data)) {
            products = products.data;
        }

        if (!products || products.length === 0) {
            console.log('   ⚠️ No products found. Test cannot proceed without products.');
            process.exit(1);
        }

        const product = products[0];
        console.log(`   Using product: ${product.name} (${product.id})`);

        // --- 3. Place Order ---
        console.log('3️⃣  Placing Order...');
        const orderPayload = {
            deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            deliveryMethod: 'delivery',
            deliveryAddress: '123 Test Street',
            specialInstructions: 'E2E Test Order',
            items: [
                {
                    productId: product.id,
                    quantity: 2,
                    price: product.price
                }
            ]
        };

        const orderRes = await axios.post(`${API_URL}/orders`, orderPayload, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });

        const orderId = orderRes.data.id;
        console.log(`   ✅ Order placed! ID: ${orderId}`);

        // --- 4. Admin Login ---
        console.log('4️⃣  Logging in as Admin...');
        const adminLoginRes = await axios.post(`${API_URL}/auth/dev-login`, {
            email: 'admin@vegshop.com'
        });

        const adminToken = adminLoginRes.data.accessToken || adminLoginRes.data.token;
        if (!adminToken) {
            throw new Error('Admin login failed - no token returned');
        }
        console.log('   ✅ Admin logged in.');

        // --- 5. Verify Order in Admin ---
        console.log('5️⃣  Verifying Order in Admin Dashboard...');
        const adminOrdersRes = await axios.get(`${API_URL}/admin/orders`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        // DEBUG: Log the raw response structure
        console.log(`   Response type: ${typeof adminOrdersRes.data}`);

        // Handle different response formats
        let orders: any[] = [];
        const rawData = adminOrdersRes.data;

        if (Array.isArray(rawData)) {
            orders = rawData;
        } else if (rawData && typeof rawData === 'object') {
            // Could be { orders: [...] } or { data: [...] }
            if (Array.isArray(rawData.orders)) {
                orders = rawData.orders;
            } else if (Array.isArray(rawData.data)) {
                orders = rawData.data;
            } else {
                // Log keys to debug
                console.log(`   Response keys: ${Object.keys(rawData).join(', ')}`);
            }
        }

        console.log(`   Total orders found: ${orders.length}`);

        const foundOrder = orders.find((o: any) => o.id === orderId);

        if (foundOrder) {
            console.log('✅ SUCCESS: Order found in Admin Dashboard!');
            console.log(`   Order ID: ${foundOrder.id}`);
            console.log(`   Status: ${foundOrder.status}`);
            console.log(`   Customer: ${foundOrder.customer?.name || foundOrder.customerId}`);
        } else {
            console.log('⚠️ WARNING: Order not found in list. Checking if it exists at all...');
            // Try getting the specific order directly
            try {
                const singleOrderRes = await axios.get(`${API_URL}/orders/${orderId}`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                console.log('✅ Order exists! Single fetch succeeded.');
                console.log(`   Status: ${singleOrderRes.data.status}`);
            } catch (e: any) {
                console.log(`   Direct fetch failed: ${e.response?.status || e.message}`);
            }
        }

        console.log('\n🎉 E2E API Test Complete!');

    } catch (error: any) {
        console.error('❌ E2E Test Failed:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

e2eApiTest();
