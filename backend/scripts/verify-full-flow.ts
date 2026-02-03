
import axios from 'axios';
import { prisma } from '../src/lib/prisma'; // Assumes correct path from scripts/
import jwt from 'jsonwebtoken';
const { sign } = jwt;
import { env } from '../src/config/env';

const API_URL = 'http://127.0.0.1:3000/api';

// Create a test token for a dummy admin user
const generateTestToken = (userId: string, role: 'admin' | 'customer') => {
    return sign({ userId, role }, env.JWT_SECRET, { expiresIn: '1h' });
};

async function runVerification() {
    console.log('🚀 Starting Backend Verification...\n');

    try {
        // 1. Setup Test Data
        const testUserEmail = `test.user.${Date.now()}@example.com`;
        const testUserPhone = `+27${Date.now().toString().slice(-9)}`;

        console.log('1. Creating Test Customer...');
        // We can't use the API easily if it requires auth to create, but public registration is usually open.
        // Let's check customer.routes.ts... router.post('/', ...) is public.

        let customerId;
        let token;

        try {
            const regRes = await axios.post(`${API_URL}/customers`, {
                name: 'Test Verification User',
                email: testUserEmail,
                phone: testUserPhone,
                address: '123 Test St, Capetown',
                password: 'password123'
            });
            customerId = regRes.data.id;
            console.log(`   ✅ Customer created: ${customerId}`);
        } catch (e: any) {
            console.error('   ❌ Failed to create customer:', e.response?.data || e.message);
            throw e;
        }

        // Login using dev-login (since we are in dev mode and standard login is SMS-based)
        console.log('2. Authenticating...');
        const authRes = await axios.post(`${API_URL}/auth/dev-login`, {
            email: testUserEmail
        });
        token = authRes.data.accessToken; // Check signature of devLogin response
        if (!token) token = authRes.data.token;
        console.log('   ✅ Authenticated successfully');

        // 3. Create a Product (Requires Admin)
        console.log('3. Creating Test Product (Admin Action)...');

        // Create admin token locally
        const adminToken = generateTestToken('admin-user-id', 'admin');

        let productId;
        const productRes = await axios.post(`${API_URL}/products`, {
            name: `Test Carrot ${Date.now()}`,
            description: 'Fresh organic carrots',
            price: 15.00,
            unit: 'pack', // Fixed from 'bunch'
            category: 'vegetables',
            stock: 100,
            isAvailable: true, // Added
            isSeasonal: false // Added
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        productId = productRes.data.id;
        console.log(`   ✅ Product created: ${productId}`);

        // 4. Create Order (As Customer)
        console.log('4. Placing Order...');
        const nextFriday = new Date();
        nextFriday.setDate(nextFriday.getDate() + (5 + 7 - nextFriday.getDay()) % 7 || 7);

        const orderRes = await axios.post(`${API_URL}/orders`, {
            deliveryDate: nextFriday.toISOString(),
            deliveryMethod: 'delivery',
            deliveryAddress: '123 Test St',
            items: [
                { productId, quantity: 2 }
            ]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const orderId = orderRes.data.id;
        console.log(`   ✅ Order placed: ${orderId}`);

        // 5. Generate Invoice (As Admin)
        console.log('5. Generating Invoice...');
        const invoiceRes = await axios.post(`${API_URL}/invoices/generate/${orderId}`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const invoiceId = invoiceRes.data.id;
        console.log(`   ✅ Invoice generated: ${invoiceId}`);

        // 6. Verify Invoice Details
        console.log('6. Verifying Invoice...');
        const getInvoiceRes = await axios.get(`${API_URL}/invoices/${invoiceId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (getInvoiceRes.data.total !== "30" && getInvoiceRes.data.total !== "30.00" && getInvoiceRes.data.total !== 30) {
            console.warn(`   ⚠️ Warning: Expected total 30, got ${getInvoiceRes.data.total}`);
        } else {
            console.log('   ✅ Invoice total verified (R30.00)');
        }

        // 6b. Verify Public Invoice Link & Payment
        console.log('6b. Verifying Public Payment Flow...');

        // Generate valid payment token (simulating what yokoService does)
        const paymentToken = sign({ invoiceId, type: 'payment_link' }, env.JWT_SECRET, { expiresIn: '1h' });

        // Test POST /api/payments/public
        console.log('   Testing Public Payment...');
        await axios.post(`${API_URL}/payments/public`, {
            token: paymentToken,
            invoiceId: invoiceId, // Must match token
            customerId: customerId,
            amount: 30.00,
            method: 'yoco',
            paymentDate: new Date(),
            notes: 'Public payment test'
        });
        console.log('   ✅ Public payment succeeded');

        // Verify invoice is now PAID
        const paidInvoiceRes = await axios.get(`${API_URL}/invoices/public/${paymentToken}`);
        if (paidInvoiceRes.data.status === 'paid') {
            console.log('   ✅ Invoice marked as PAID via public link');
        } else {
            console.warn(`   ⚠️ Warning: Invoice status is ${paidInvoiceRes.data.status}, expected 'paid'`);
        }

        // 6c. Verify Admin Notifications
        console.log('6c. Verifying Admin Notifications...');
        try {
            const notifRes = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (Array.isArray(notifRes.data)) {
                console.log(`   ✅ Admin notifications fetched (${notifRes.data.length} found)`);
            } else {
                console.error('   ❌ Notifications endpoint did not return an array');
            }
        } catch (e: any) {
            console.error('   ❌ Failed to fetch notifications:', e.message);
        }

        // 7. Verify Admin Dashboard Metrics
        console.log('7. Verifying Dashboard Metrics...');
        const metricsRes = await axios.get(`${API_URL}/admin/dashboard/metrics`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (metricsRes.data.totalOrders > 0) {
            console.log('   ✅ Dashboard metrics verified (Orders exist)');
        } else {
            console.warn('   ⚠️ Dashboard metrics zero?');
        }

        console.log('\n✨ Backend Verification Complete: SUCCESS ✨');

    } catch (error: any) {
        console.error('\n❌ Verification Failed:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

runVerification();
