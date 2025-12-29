import express from 'express';
import cors from 'cors';
import { env, logConfig } from './config/env.js';
import { apiLimiter } from './middleware/rate-limit.middleware.js';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import creditRoutes from './routes/credits.routes.js';

// ... (existing imports)

// ... (later in file)
// Imports fixed
import packingListRoutes from './routes/packing-list.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';
import customerRoutes from './routes/customer.routes.js';
import auditRoutes from './routes/audit.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { schedulerService } from './services/scheduler.service.js';

// Log configuration on startup
console.log('🚀 Starting Organic Veg Order Management System...\n');
logConfig();
console.log(`NODE_ENV from env.ts: ${env.NODE_ENV}`);

const app = express();
const PORT = env.PORT;

// Trust proxy to get correct IP for rate limiting
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/packing-lists', packingListRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/admin', adminRoutes);

// Start server with increased header size
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 CORS Origin: ${env.CORS_ORIGIN}`);

  // Initialize scheduler
  schedulerService.init();
});

// Increase header size limit
server.maxHeadersCount = 0;
server.headersTimeout = 60000;
