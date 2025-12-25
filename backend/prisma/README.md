# Database Seed Script

This directory contains the database seed script that populates the database with initial data for development and testing.

## What Gets Seeded

### Users
- **1 Admin User**: `admin@vegshop.com` (role: admin)
- **3 Sample Customers**:
  - John Smith (`john@example.com`)
  - Sarah Johnson (`sarah@example.com`)
  - Mike Williams (`mike@example.com`)

### Products (48 total)
The seed script creates a comprehensive product catalog across 6 categories:

1. **Vegetables** (10 products): Tomatoes, Potatoes, Onions, Carrots, Lettuce, Spinach, Peppers, Cucumbers, Broccoli, Cauliflower
2. **Fruits** (7 products): Apples, Bananas, Oranges, Grapes, Strawberries (seasonal), Pears, Lemons
3. **Dairy & Eggs** (7 products): Milk (1L & 2L), Eggs (6 & 12 pack), Cheddar Cheese, Yogurt, Butter
4. **Bread & Bakery** (4 products): White Bread, Whole Wheat Bread, Sourdough, Dinner Rolls
5. **Pantry Items** (5 products): Olive Oil, Honey, Pasta, Rice, Flour
6. **Meat & Protein** (4 products): Chicken Breast, Chicken Thighs, Beef Mince, Beef Steak

All products include:
- Name, price, category, unit of measure
- Description
- Availability status (all available by default)
- Seasonal flag (where applicable)

## How to Run

### Option 1: Using npm script (Recommended)
```bash
npm run prisma:seed
```

### Option 2: Using Prisma CLI
```bash
npx prisma db seed
```

### Option 3: After migrations
The seed script automatically runs after `prisma migrate dev` if configured in package.json.

## Prerequisites

1. Database must be running and accessible
2. Database URL must be configured in `.env` file
3. Prisma migrations must be applied

## Sample Credentials

After seeding, you can use these credentials for testing:

**Admin Account:**
- Email: `admin@vegshop.com`
- Phone: `+27821234567`

**Customer Accounts:**
- Email: `john@example.com` | Phone: `+27821111111`
- Email: `sarah@example.com` | Phone: `+27822222222`
- Email: `mike@example.com` | Phone: `+27823333333`

Note: Authentication uses verification codes sent via WhatsApp/Email, not passwords.

## Idempotency

The seed script uses `upsert` operations, making it safe to run multiple times. Existing records will not be duplicated.

## Customization

To modify the seed data:
1. Edit `seed.ts`
2. Add/remove products or users as needed
3. Run the seed script again

## Troubleshooting

**Error: "Cannot find module"**
- Ensure `tsx` is installed: `npm install`

**Error: "Database connection failed"**
- Check your `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running

**Error: "Unique constraint violation"**
- The script uses upsert, so this shouldn't happen
- If it does, check for duplicate data in your database
