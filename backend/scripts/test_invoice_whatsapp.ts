import { prisma } from '../src/lib/prisma.js';
import { invoiceService } from '../src/services/invoice.service.js';
import { notificationService } from '../src/services/notification.service.js';
import { paymentService } from '../src/services/payment.service.js';
import { promises as fs } from 'fs';
import path from 'path';

const TEST_PHONE = '+27817805847';
const OUTPUT_DIR = './test_outputs';

async function testInvoicePDFAndWhatsApp() {
    console.log('🧪 Starting Invoice PDF & WhatsApp Integration Test\n');

    try {
        // Ensure output directory exists
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // --- Step 1: Find an existing invoice or create one ---
        console.log('1️⃣  Finding an invoice to test...');
        let invoice = await prisma.invoice.findFirst({
            include: {
                customer: true,
                order: { include: { items: { include: { product: true } } } },
                payments: true
            }
        });

        if (!invoice) {
            console.log('   No invoices found. Creating a test order and invoice...');

            // Find or create a customer
            let customer = await prisma.user.findFirst({ where: { role: 'customer' } });
            if (!customer) {
                customer = await prisma.user.create({
                    data: {
                        name: 'Test Customer',
                        email: 'test@example.com',
                        phone: TEST_PHONE,
                        role: 'customer',
                        address: '123 Test Street'
                    }
                });
            }

            // Find a product
            const product = await prisma.product.findFirst();
            if (!product) {
                throw new Error('No products found. Please seed products first.');
            }

            // Create an order
            const order = await prisma.order.create({
                data: {
                    customerId: customer.id,
                    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    deliveryMethod: 'delivery',
                    deliveryAddress: customer.address || '123 Test Street',
                    status: 'confirmed',
                    items: {
                        create: [{
                            productId: product.id,
                            quantity: 3,
                            priceAtOrder: product.price
                        }]
                    }
                },
                include: { items: true }
            });

            // Generate invoice for the order
            const generatedInvoice = await invoiceService.generateInvoice(order.id);
            invoice = await prisma.invoice.findUnique({
                where: { id: generatedInvoice.id },
                include: {
                    customer: true,
                    order: { include: { items: { include: { product: true } } } },
                    payments: true
                }
            });
        }

        if (!invoice) {
            throw new Error('Could not find or create an invoice');
        }

        console.log(`   ✅ Using Invoice: ${invoice.id}`);
        console.log(`      Customer: ${invoice.customer?.name || 'Unknown'}`);
        console.log(`      Total: R ${Number(invoice.total).toFixed(2)}`);
        console.log(`      Status: ${invoice.status}`);

        // --- Step 2: Record a payment (if not already paid) ---
        if (invoice.status !== 'paid') {
            console.log('\n2️⃣  Recording Payment...');
            try {
                const paymentAmount = Number(invoice.total);
                const payment = await paymentService.recordPayment({
                    invoiceId: invoice.id,
                    customerId: invoice.customerId,
                    amount: paymentAmount,
                    method: 'eft',
                    paymentDate: new Date(),
                    notes: 'Test payment for PDF generation'
                });
                console.log(`   ✅ Payment recorded! ID: ${payment.id}`);
                console.log(`      Amount: R ${paymentAmount.toFixed(2)}`);
            } catch (error: any) {
                console.log(`   ⚠️ Payment recording issue: ${error.message}`);
                console.log('   Continuing with PDF generation anyway...');
            }
        } else {
            console.log('\n2️⃣  Invoice already paid, skipping payment step.');
        }

        // --- Step 3: Generate Invoice PDF ---
        console.log('\n3️⃣  Generating Invoice PDF...');
        const pdfBuffer = await invoiceService.generateInvoicePDF(invoice.id);

        // Save to output directory
        const pdfFilename = `invoice_${invoice.id}_${Date.now()}.pdf`;
        const pdfPath = path.join(OUTPUT_DIR, pdfFilename);
        await fs.writeFile(pdfPath, pdfBuffer);

        console.log(`   ✅ PDF Generated and Saved!`);
        console.log(`      File: ${pdfPath}`);
        console.log(`      Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // Also save to uploads folder
        const uploadsPath = path.join('./uploads', pdfFilename);
        await fs.mkdir('./uploads', { recursive: true });
        await fs.writeFile(uploadsPath, pdfBuffer);
        console.log(`      Also saved to: ${uploadsPath}`);

        // --- Step 4: Send WhatsApp Message ---
        console.log('\n4️⃣  Sending WhatsApp Message...');
        const message = `🧾 *Invoice Ready*\n\nHello ${invoice.customer?.name || 'Customer'},\n\nYour invoice #${invoice.id} for R ${Number(invoice.total).toFixed(2)} has been generated.\n\nThank you for your business!\n\n_Organic Veg Order Management_`;

        try {
            await notificationService.sendWhatsAppMessage(TEST_PHONE, message);
            console.log(`   ✅ WhatsApp message sent to ${TEST_PHONE}`);
        } catch (error: any) {
            console.log(`   ⚠️ WhatsApp sending: ${error.message}`);
        }

        // --- Step 5: Summary ---
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Invoice ID: ${invoice.id}`);
        console.log(`✅ PDF saved to: ${pdfPath}`);
        console.log(`✅ PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
        console.log(`📱 WhatsApp target: ${TEST_PHONE}`);
        console.log('='.repeat(50));

        console.log('\n🎉 Test Complete!');
        console.log(`\n📂 View the PDF at: ${path.resolve(pdfPath)}`);

    } catch (error: any) {
        console.error('❌ Test Failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testInvoicePDFAndWhatsApp();
