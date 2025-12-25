import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  console.log('Creating admin user...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vegshop.com' },
    update: {},
    create: {
      email: 'admin@vegshop.com',
      phone: '+27821234567',
      name: 'Admin User',
      address: '123 Admin Street, Cape Town',
      role: 'admin',
      deliveryPreference: 'delivery',
    },
  });
  console.log(`✓ Admin user created: ${admin.email}`);

  // Create sample customers
  console.log('Creating sample customers...');
  const customers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        phone: '+27821111111',
        name: 'John Smith',
        address: '10 Oak Street, Cape Town',
        role: 'customer',
        deliveryPreference: 'delivery',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: {},
      create: {
        email: 'sarah@example.com',
        phone: '+27822222222',
        name: 'Sarah Johnson',
        address: '25 Pine Avenue, Cape Town',
        role: 'customer',
        deliveryPreference: 'delivery',
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike@example.com' },
      update: {},
      create: {
        email: 'mike@example.com',
        phone: '+27823333333',
        name: 'Mike Williams',
        address: '42 Maple Road, Cape Town',
        role: 'customer',
        deliveryPreference: 'collection',
      },
    }),
  ]);
  console.log(`✓ Created ${customers.length} sample customers`);

  // Create product categories first
  console.log('Creating product categories...');
  const categories = [
    { key: 'vegetables', label: 'Vegetables', description: 'Fresh organic vegetables', sortOrder: 1 },
    { key: 'fruits', label: 'Fruits', description: 'Fresh seasonal fruits', sortOrder: 2 },
    { key: 'dairy_eggs', label: 'Dairy & Eggs', description: 'Dairy products and eggs', sortOrder: 3 },
    { key: 'bread_bakery', label: 'Bread & Bakery', description: 'Fresh baked goods', sortOrder: 4 },
    { key: 'pantry', label: 'Pantry', description: 'Pantry essentials', sortOrder: 5 },
    { key: 'meat_protein', label: 'Meat & Protein', description: 'Fresh meat and protein', sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { key: cat.key },
      update: {},
      create: cat,
    });
  }
  console.log(`✓ Created ${categories.length} product categories`);

  // Create product catalog
  console.log('Creating product catalog...');

  // Vegetables
  const vegetables = [
    { name: 'Tomatoes', price: 35.00, unit: 'kg', description: 'Fresh organic tomatoes' },
    { name: 'Potatoes', price: 25.00, unit: 'kg', description: 'Organic potatoes' },
    { name: 'Onions', price: 20.00, unit: 'kg', description: 'Yellow onions' },
    { name: 'Carrots', price: 28.00, unit: 'kg', description: 'Fresh carrots' },
    { name: 'Lettuce', price: 15.00, unit: 'piece', description: 'Crisp lettuce head' },
    { name: 'Spinach', price: 22.00, unit: 'pack', description: 'Fresh spinach bunch' },
    { name: 'Peppers', price: 45.00, unit: 'kg', description: 'Mixed bell peppers' },
    { name: 'Cucumbers', price: 12.00, unit: 'piece', description: 'Fresh cucumbers' },
    { name: 'Broccoli', price: 38.00, unit: 'kg', description: 'Fresh broccoli' },
    { name: 'Cauliflower', price: 35.00, unit: 'piece', description: 'Whole cauliflower' },
  ];

  // Fruits
  const fruits = [
    { name: 'Apples', price: 40.00, unit: 'kg', description: 'Crisp red apples' },
    { name: 'Bananas', price: 30.00, unit: 'kg', description: 'Fresh bananas' },
    { name: 'Oranges', price: 35.00, unit: 'kg', description: 'Juicy oranges' },
    { name: 'Grapes', price: 65.00, unit: 'kg', description: 'Seedless grapes' },
    { name: 'Strawberries', price: 55.00, unit: 'pack', description: 'Fresh strawberries', isSeasonal: true },
    { name: 'Pears', price: 45.00, unit: 'kg', description: 'Sweet pears' },
    { name: 'Lemons', price: 25.00, unit: 'kg', description: 'Fresh lemons' },
  ];

  // Dairy & Eggs
  const dairy = [
    { name: 'Milk - 1L', price: 22.00, unit: 'L', description: 'Fresh organic milk' },
    { name: 'Milk - 2L', price: 42.00, unit: 'L', description: 'Fresh organic milk' },
    { name: 'Eggs - 6 pack', price: 35.00, unit: 'pack', description: 'Free-range eggs' },
    { name: 'Eggs - 12 pack', price: 65.00, unit: 'pack', description: 'Free-range eggs' },
    { name: 'Cheddar Cheese', price: 85.00, unit: 'pack', description: 'Aged cheddar 500g' },
    { name: 'Yogurt', price: 28.00, unit: 'pack', description: 'Plain yogurt 500ml' },
    { name: 'Butter', price: 45.00, unit: 'pack', description: 'Salted butter 250g' },
  ];

  // Bread & Bakery
  const bread = [
    { name: 'White Bread', price: 18.00, unit: 'loaf', description: 'Fresh white bread' },
    { name: 'Whole Wheat Bread', price: 22.00, unit: 'loaf', description: 'Whole wheat bread' },
    { name: 'Sourdough', price: 35.00, unit: 'loaf', description: 'Artisan sourdough' },
    { name: 'Dinner Rolls', price: 25.00, unit: 'pack', description: 'Pack of 6 rolls' },
  ];

  // Pantry Items
  const pantry = [
    { name: 'Olive Oil', price: 95.00, unit: 'ml', description: 'Extra virgin olive oil 500ml' },
    { name: 'Honey', price: 75.00, unit: 'g', description: 'Raw honey 500g' },
    { name: 'Pasta', price: 32.00, unit: 'pack', description: 'Organic pasta 500g' },
    { name: 'Rice', price: 45.00, unit: 'kg', description: 'Basmati rice' },
    { name: 'Flour', price: 28.00, unit: 'kg', description: 'All-purpose flour' },
  ];

  // Meat & Protein
  const meat = [
    { name: 'Chicken Breast', price: 95.00, unit: 'kg', description: 'Free-range chicken breast' },
    { name: 'Chicken Thighs', price: 75.00, unit: 'kg', description: 'Free-range chicken thighs' },
    { name: 'Beef Mince', price: 110.00, unit: 'kg', description: 'Grass-fed beef mince' },
    { name: 'Beef Steak', price: 180.00, unit: 'kg', description: 'Grass-fed beef steak' },
  ];

  // Insert all products
  const productCategories = [
    { category: 'vegetables', items: vegetables },
    { category: 'fruits', items: fruits },
    { category: 'dairy_eggs', items: dairy },
    { category: 'bread_bakery', items: bread },
    { category: 'pantry', items: pantry },
    { category: 'meat_protein', items: meat },
  ];

  let totalProducts = 0;
  for (const { category, items } of productCategories) {
    for (const item of items) {
      await prisma.product.upsert({
        where: { name: item.name },
        update: {},
        create: {
          name: item.name,
          price: item.price,
          category,
          unit: item.unit,
          description: item.description,
          isAvailable: true,
          isSeasonal: item.isSeasonal || false,
        },
      });
      totalProducts++;
    }
  }
  console.log(`✓ Created ${totalProducts} products across ${productCategories.length} categories`);

  console.log('✅ Database seed completed successfully!');
  console.log('\nSample credentials:');
  console.log('Admin: admin@vegshop.com');
  console.log('Customer 1: john@example.com');
  console.log('Customer 2: sarah@example.com');
  console.log('Customer 3: mike@example.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
