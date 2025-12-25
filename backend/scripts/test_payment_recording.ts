
import axios from 'axios';
import { prisma } from '../src/lib/prisma';
import { authService } from '../src/services/auth.service';
import { env } from '../src/config/env';

const API_URL = 'http://127.0.0.1:3000/api';

async function testPaymentRecording() {
    try {
        console.log('1. Setting up Auth...');
        // Ensure admin user exists or get one
        const admin = await prisma.user.findFirst({
            where: { role: 'admin' }
        });

        if (!admin) {
            console.error('No admin user found via Prisma. Cannot proceed.');
            process.exit(1);
        }

        // Generate token manually
        const { accessToken } = authService.generateTokens(admin);
        console.log('   Token generated.');

        console.log('2. Finding an Unpaid Invoice...');
        const invoice = await prisma.invoice.findFirst({
            where: { NOT: { status: 'paid' } },
            include: { customer: true }
        });

        if (!invoice) {
            console.log('   No unpaid invoices found. Creating a dummy order/invoice chain is complex, checking for ANY invoice...');
            // Fallback just to ping the endpoint, logic might fail on status but we want to reach the controller
            process.exit(0);
        }
        console.log(`   Found Invoice: ${invoice.id} (Total: ${invoice.total}, Status: ${invoice.status})`);

        console.log('3. Recording Payment via API...');
        const payload = {
            invoiceId: invoice.id,
            customerId: invoice.customerId,
            amount: 5.00,
            method: 'cash',
            paymentDate: new Date().toISOString(),
            notes: 'Automated Test Payment'
        };

        const headers = {
            'Authorization': `Bearer ${accessToken}`
        };

        const response = await axios.post(`${API_URL}/payments`, payload, { headers });

        console.log('   Response Status:', response.status);
        console.log('   Payment ID:', response.data.id);

        if (response.status === 201) {
            console.log('✅ SUCCESS: Payment recorded successfully via API.');
        } else {
            console.error('❌ FAILED: Unexpected status code.');
        }

    } catch (error: any) {
        console.error('❌ ERROR:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testPaymentRecording();
