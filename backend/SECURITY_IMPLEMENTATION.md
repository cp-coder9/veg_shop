# Security and Performance Implementation

This document describes the security and performance features implemented in Task 16.

## Overview

Task 16 implemented comprehensive security and performance features including:
- Rate limiting to prevent abuse
- Input validation to prevent injection attacks
- Database indexing for query performance
- Audit logging for accountability
- Security tests to verify implementation

## 1. Rate Limiting

### Implementation
Location: `backend/src/middleware/rate-limit.middleware.ts`

Three rate limiters using `express-rate-limit`:

1. **Verification Code Limiter**: 3 requests per hour per contact
2. **Login Attempt Limiter**: 5 requests per hour per contact  
3. **General API Limiter**: 100 requests per minute per user

### Usage
```typescript
// In auth routes
router.post('/send-code', verificationCodeLimiter, validate(sendCodeSchema), handler);
router.post('/verify-code', loginAttemptLimiter, validate(verifyCodeSchema), handler);

// In main app
app.use('/api', apiLimiter);
```

### Key Features
- Custom key generators (contact, userId, or IP)
- Standard rate limit headers
- Structured error responses

## 2. Input Validation

### Implementation
Location: `backend/src/middleware/validation.middleware.ts`
Schemas: `backend/src/schemas/validation.schemas.ts`

Reusable validation middleware using Zod schemas.

### Validation Schemas

#### Authentication
- `sendCodeSchema` - Email/phone validation with regex
- `verifyCodeSchema` - 6-digit code validation
- `refreshTokenSchema` - Token presence validation

#### Products
- `createProductSchema` - Name, price, category, unit validation
- `updateProductSchema` - Partial product updates
- Category enum: vegetables, fruits, dairy, bread, pantry, meat
- Unit enum: kg, g, unit, bunch, pack, dozen, litre, ml

#### Orders
- `createOrderSchema` - Delivery date (Mon/Wed/Fri), items validation
- `updateOrderStatusSchema` - Status enum validation
- `bulkOrderSchema` - Date range validation

#### Payments
- `createPaymentSchema` - Amount, method, date validation
- `shortDeliverySchema` - Order and items validation
- Method enum: cash, yoco, eft

#### Customers
- `createCustomerSchema` - Contact info validation
- `updateCustomerSchema` - Partial updates

#### Notifications
- `sendNotificationSchema` - Content and method validation
- `sendPaymentReminderSchema` - Customer ID validation
- `sendProductListSchema` - Customer IDs array validation

### Usage
```typescript
router.post('/endpoint', validate(createSchema), authenticate, handler);
```

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "price",
        "message": "Price must be positive"
      }
    ]
  }
}
```

## 3. Database Indexing

### Implementation
Location: `backend/prisma/schema.prisma`

Added indexes for frequently queried fields:

#### Orders Table
- `customerId` - Customer order queries
- `deliveryDate` - Delivery date filtering
- `status` - Status-based queries

#### Invoices Table
- `(customerId, status)` - Composite index for payment reports

#### Payments Table
- `customerId` - Payment history queries

#### VerificationCodes Table
- `contact` - Auth lookups (already existed)

#### AuditLogs Table
- `userId` - User activity queries
- `action` - Action filtering
- `resource` - Resource filtering
- `createdAt` - Time-based queries

### Migration
Run when database is available:
```bash
npx prisma migrate dev --name add_performance_indexes
```

## 4. Audit Logging

### Implementation
Components:
1. Database model: `backend/prisma/schema.prisma`
2. Service: `backend/src/services/audit.service.ts`
3. Middleware: `backend/src/middleware/audit.middleware.ts`
4. Routes: `backend/src/routes/audit.routes.ts`

### Audit Log Model
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  action     String
  resource   String
  resourceId String?
  details    String?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
}
```

### Logged Actions

#### Admin Actions
- Product: CREATE, UPDATE, DELETE
- Payment: CREATE
- Invoice: GENERATE

#### Authentication
- AUTH_SUCCESS - Successful login
- AUTH_FAILED - Failed login attempt

### Usage

#### In Routes
```typescript
router.post('/products', 
  authenticate, 
  requireAdmin, 
  auditLog('CREATE', 'product'), 
  handler
);
```

#### In Services
```typescript
await auditService.log({
  userId: user.id,
  action: 'AUTH_SUCCESS',
  resource: 'authentication',
  details: JSON.stringify({ contact }),
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
```

### Viewing Audit Logs
Admin-only endpoint: `GET /api/audit-logs`

Query parameters:
- `userId` - Filter by user
- `action` - Filter by action
- `resource` - Filter by resource
- `startDate` - Filter by date range
- `endDate` - Filter by date range
- `limit` - Pagination limit
- `offset` - Pagination offset

## 5. Security Tests

### Implementation
Location: `backend/src/tests/security.test.ts`

25 comprehensive tests covering:

#### Rate Limiting (3 tests)
- Verification code rate limiting
- Login attempt rate limiting
- General API rate limiting

#### Input Validation (9 tests)
- Phone number validation
- Email validation
- Verification code validation
- Price validation
- Product category validation
- Delivery date validation
- Delivery day validation (Mon/Wed/Fri)
- Order items validation
- Payment method validation

#### Authorization (3 tests)
- JWT token structure
- Role inclusion in tokens
- Customer vs admin differentiation

#### JWT Token Security (2 tests)
- Token uniqueness per user
- Token expiration configuration

#### SQL Injection Prevention (1 test)
- Prisma parameterized queries

#### Verification Code Security (5 tests)
- 6-digit code generation
- Code uniqueness
- 10-minute expiration
- Expired code rejection
- Code deletion after use

#### Audit Logging (2 tests)
- Failed authentication logging
- Successful authentication logging

### Running Tests
```bash
npm test -- security.test.ts
```

All 25 tests pass successfully.

## Security Best Practices

1. **Rate Limiting** - Prevents brute force and DoS attacks
2. **Input Validation** - Prevents injection attacks and bad data
3. **Database Indexing** - Improves query performance
4. **Audit Logging** - Provides accountability and forensics
5. **JWT Tokens** - Secure authentication with expiration
6. **Role-Based Access** - Customer vs admin separation
7. **Prisma ORM** - Prevents SQL injection
8. **Code Expiration** - 10-minute verification code lifetime
9. **Code Deletion** - Immediate deletion after use
10. **Failed Attempt Logging** - Security monitoring

## Integration Pattern

Typical route with all security features:

```typescript
router.post('/endpoint',
  rateLimiter,              // Rate limiting
  validate(schema),         // Input validation
  authenticate,             // JWT authentication
  requireAdmin,             // Role authorization
  auditLog('ACTION', 'resource'), // Audit logging
  asyncHandler(handler)     // Error handling
);
```

## Environment Variables

Required for security features:
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_ACCESS_EXPIRY` - Access token expiration (default: 15m)
- `JWT_REFRESH_EXPIRY` - Refresh token expiration (default: 7d)

## Next Steps

When database is available:
1. Run migration: `npx prisma migrate dev --name add_performance_indexes`
2. Test query performance with EXPLAIN ANALYZE
3. Monitor audit logs for security events
4. Adjust rate limits based on usage patterns
