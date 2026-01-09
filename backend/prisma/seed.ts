import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vegshop.com' },
    update: {
      password: adminPassword,
    },
    create: {
      email: 'admin@vegshop.com',
      phone: '+27821234567',
      name: 'Admin User',
      address: '123 Admin Street, Cape Town',
      role: 'admin',
      password: adminPassword,
      deliveryPreference: 'delivery',
    },
  });
  console.log(`✓ Admin user created: ${admin.email}`);

  // Create sample customers
  console.log('Creating sample customers...');
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {
        password: customerPassword,
      },
      create: {
        email: 'john@example.com',
        phone: '+27821111111',
        name: 'John Smith',
        address: '10 Oak Street, Cape Town',
        role: 'customer',
        password: customerPassword,
        deliveryPreference: 'delivery',
      },
    }),
  ]);
  console.log(`✓ Created ${customers.length} sample customers`);

  // Create packer user
  console.log('Creating packer user...');
  const packerPassword = await bcrypt.hash('packer123', 10);
  const packer = await prisma.user.upsert({
    where: { email: 'packer@vegshop.com' },
    update: {
      password: packerPassword,
    },
    create: {
      email: 'packer@vegshop.com',
      phone: '+27822222222',
      name: 'Packer User',
      address: 'Packer Station 1',
      role: 'packer',
      password: packerPassword,
      deliveryPreference: 'collection',
    },
  });
  console.log(`✓ Packer user created: ${packer.email}`);

  // Create driver user
  console.log('Creating driver user...');
  const driverPassword = await bcrypt.hash('driver123', 10);
  const driver = await prisma.user.upsert({
    where: { email: 'driver@vegshop.com' },
    update: {
      password: driverPassword,
    },
    create: {
      email: 'driver@vegshop.com',
      phone: '+27823333333',
      name: 'Driver User',
      address: 'Driver Depot',
      role: 'driver',
      password: driverPassword,
      deliveryPreference: 'delivery',
    },
  });
  console.log(`✓ Driver user created: ${driver.email}`);

  // Create product categories
  console.log('Creating product categories...');
  const categories = [
    { key: 'bakery', label: 'Pantry & Bakery', description: 'Fresh baked goods (Mon)', sortOrder: 1 },
    { key: 'broths', label: 'Broths & Brothcicles', description: 'Nutritious broths (Mon)', sortOrder: 2 },
    { key: 'nuts_fruit', label: 'Nuts & Dried Fruit', description: 'SO Natural products (Mon)', sortOrder: 3 },
    { key: 'vegetables', label: 'Vegetables', description: 'Organic/Biodynamic veg (Wed)', sortOrder: 4 },
    { key: 'fruit', label: 'Fruit', description: 'Organic & Non-organic export quality (Wed)', sortOrder: 5 },
    { key: 'local_produce', label: 'Local Farm Produce', description: 'Olive tapenade, biltong, trout', sortOrder: 6 },
    { key: 'plant_based', label: 'Plant Based (Tabu)', description: 'Organic plant based foods', sortOrder: 7 },
    { key: 'dairy', label: 'Dairy', description: 'Mysthill & Montagu Raw Dairy (Fri)', sortOrder: 8 },
    { key: 'meat', label: 'Meat & Poultry', description: 'Grass-fed beef & free range (Fri)', sortOrder: 9 },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { key: cat.key },
      update: {},
      create: cat,
    });
  }

  // Define Products
  const bakery = [
    { name: 'Eggs - Pasture raised x12', price: 65, unit: 'pack' },
    { name: 'Eggs - Pasture raised x30', price: 150, unit: 'tray' },
    { name: 'Sourdough loaf - Vadas', price: 65, unit: 'loaf' },
    { name: 'Farmers loaf - Vadas', price: 70, unit: 'loaf', description: 'Mix of seeds, honey, rye sprouted berries, spice mix' },
    { name: 'Plaasbrood loaf', price: 45, unit: 'loaf', description: 'Stoneground flour, milk, salt, sugar, yeast, olive oil' },
    { name: 'Pizza bases x2 - Vadas (Sourdough)', price: 130, unit: 'pack', description: '48hr ferment sourdough (no cheese)' },
    { name: 'Gluten Free Pizza bases x2 - Vadas', price: 130, unit: 'pack', description: 'Chickpea flour, yeast, sugar, olive oil, xanthan gum' },
  ];

  const broths = [
    { name: 'Beef broth 800ml (Broth co)', price: 110, unit: 'bottle', description: 'Grass-fed & finished' },
    { name: 'Beef broth cubes 600ml', price: 110, unit: 'pack', description: 'Grass-fed & finished' },
    { name: 'Chicken broth 800ml (Broth co)', price: 110, unit: 'bottle', description: 'Pasture reared' },
    { name: 'Chicken broth cubes 600ml', price: 110, unit: 'pack', description: 'Pasture reared' },
    { name: 'Brothcicles - Mixed fruit (5 pack)', price: 98, unit: 'pack' },
    { name: 'Brothcicles - Mango (5 pack)', price: 98, unit: 'pack' },
    { name: 'Brothcicles - Strawberry (5 pack)', price: 98, unit: 'pack' },
    { name: 'Brothcicles - Banana & Blueberry (5 pack)', price: 98, unit: 'pack' },
    { name: 'Brothcicles - Apple Cinnamon (5 pack)', price: 98, unit: 'pack' },
  ];

  const nuts_fruit = [
    { name: 'Pomegranate juice frozen 500ml', price: 70, unit: 'bottle' },
    { name: 'Pomegranate juice frozen 1L', price: 120, unit: 'bottle' },
    { name: 'Medjool dates 250g', price: 50, unit: 'pack' },
    { name: 'Medjool dates 500g', price: 70, unit: 'pack' },
    { name: 'Dark choc dates (3 pack)', price: 60, unit: 'pack' },
    { name: 'Dark choc dates (Gift box 6)', price: 120, unit: 'box' },
    { name: 'White choc dates (3 pack)', price: 60, unit: 'pack' },
    { name: 'Assorted choc dates (Gift box 6)', price: 120, unit: 'box' },
    { name: 'Almonds raw 500g', price: 150, unit: 'pack' },
    { name: 'Macadamia halves raw 500g', price: 190, unit: 'pack' },
    { name: 'Pecan large pieces raw 500g', price: 180, unit: 'pack' },
    { name: 'Cashews raw 500g', price: 170, unit: 'pack' },
    { name: 'Walnuts large pieces raw 500g', price: 170, unit: 'pack' },
    { name: 'Mixed nuts 500g', price: 190, unit: 'pack' },
    { name: 'Raisins 500g', price: 80, unit: 'pack', description: 'Sun-dried, seed oil/sulphur free' },
    { name: 'Nut butter - Crunchy mix roasted 350g', price: 120, unit: 'jar' },
    { name: 'Nut butter - Roasted almond 350g', price: 95, unit: 'jar' },
    { name: 'Nut butter - Macadamia raw 350g', price: 95, unit: 'jar' },
    { name: 'Nut butter - Pecan & Date 350g', price: 110, unit: 'jar' },
    { name: 'Nut butter - Cashew roasted 350g', price: 95, unit: 'jar' },
    { name: 'Raw Honey - Fynbos 500g', price: 110, unit: 'jar' },
    { name: 'Raw Honey - Fynbos 1.3kg', price: 230, unit: 'jar' },
    { name: 'Macadamia oil 750ml', price: 150, unit: 'bottle' },
    { name: 'Macadamia oil 4L', price: 420, unit: 'bottle' },
  ];

  const vegetables = [
    { name: 'Snacking Cucumber 500g', price: 60, unit: 'pack' },
    { name: 'Asparagus green bunch', price: 65, unit: 'bunch' },
    { name: 'Pak choi', price: 38, unit: 'bunch' },
    { name: 'Baby spinach pack 120g', price: 37, unit: 'pack' },
    { name: 'Baby marrow 500g', price: 55, unit: 'pack' },
    { name: 'Beetroot bunch', price: 30, unit: 'bunch' },
    { name: 'Green beans 500g', price: 40, unit: 'pack' },
    { name: 'Diced green beans 350g', price: 35, unit: 'pack' },
    { name: 'Fennel Bulb', price: 10, unit: 'each' },
    { name: 'Onions 1kg', price: 35, unit: 'kg' },
    { name: 'Ginger 200g', price: 60, unit: 'pack' },
    { name: 'Soup/Roast veg mix 400g', price: 37, unit: 'pack' },
    { name: 'Soup/Roast veg mix 800g', price: 52, unit: 'pack' },
    { name: 'QC Leeks', price: 32, unit: 'bunch' },
    { name: 'QC Spring onion', price: 25, unit: 'bunch' },
    { name: 'QC Italian parsley 50g', price: 20, unit: 'bunch' },
    { name: 'Mint bunch', price: 25, unit: 'bunch' },
    { name: 'Rosemary 40g', price: 25, unit: 'pack' },
    { name: 'Mixed herb bunch 40g', price: 25, unit: 'bunch' },
    { name: 'Jerusalem artichokes 500g', price: 30, unit: 'pack' },
    { name: 'Herb salad', price: 32, unit: 'pack', description: 'Rocket, mizuna, mustard' },
    { name: 'Lettuce - Baby leaf 115g', price: 32, unit: 'pack' },
    { name: 'Lettuce - Cos head', price: 27, unit: 'head' },
    { name: 'Lettuce - Butter head', price: 25, unit: 'head' },
    { name: 'QC Table celery bunch', price: 35, unit: 'bunch' },
    { name: 'Pre-cut celery sticks 130g', price: 35, unit: 'pack' },
    { name: 'Green peppers 500g', price: 30, unit: 'pack' },
    { name: 'Sweet potato 1kg', price: 42, unit: 'kg' },
    { name: 'White cabbage', price: 35, unit: 'head' },
    { name: 'Red cabbage', price: 35, unit: 'head' },
    { name: 'Waterblommetjie fresh 500g', price: 60, unit: 'pack' },
    { name: 'Turnip bunch', price: 32, unit: 'bunch' },
    { name: 'Radish', price: 34, unit: 'bunch' },
  ];

  const fruit = [
    { name: 'Organic Lemons 1kg', price: 35, unit: 'kg' },
    { name: 'Frozen Dragon Fruit 500g', price: 70, unit: 'pack' },
    { name: 'Frozen Blueberries 500g', price: 70, unit: 'pack' },
    { name: 'Frozen Blueberries 1kg', price: 120, unit: 'pack' },
    { name: 'Organic Grapefruit 1kg', price: 40, unit: 'kg' },
    { name: 'Organic Limes 500g', price: 60, unit: 'pack' },
    { name: 'Apples Granny Smith', price: 38, unit: 'kg', description: 'Non-organic export quality' },
    { name: 'Apples Fuji', price: 38, unit: 'kg', description: 'Non-organic export quality' },
    { name: 'Pears', price: 42, unit: 'kg', description: 'Non-organic export quality' },
    { name: 'Dried Parisian figs 200g', price: 75, unit: 'pack' },
  ];

  const local_produce = [
    { name: 'Organic Olive Tapenade 125g', price: 58, unit: 'tub' },
    { name: 'Free range beef biltong piece (~100g)', price: 70, unit: 'piece' },
    { name: 'Cold smoked trout ribbons 80g', price: 75, unit: 'pack' },
  ];

  const plant_based = [
    { name: 'Tempeh single pack 220g', price: 40, unit: 'pack' },
    { name: 'Black bean tempeh 220g', price: 40, unit: 'pack' },
    { name: 'Tofu 350g', price: 60, unit: 'block' },
    { name: 'Tofu smoked 350g', price: 60, unit: 'block' },
    { name: 'Silken tofu 350g', price: 40, unit: 'pack' },
    { name: 'Seitan 280g', price: 60, unit: 'pack' },
    { name: 'Miso organic Hatcho 300g', price: 197, unit: 'pack' },
    { name: 'Tamari organic soy sauce 250ml', price: 121, unit: 'bottle' },
    { name: 'Nama soya (unpasteurised) 250ml', price: 120, unit: 'bottle' },
    { name: 'Tamari Teriyaki 125ml', price: 71, unit: 'bottle' },
    { name: 'Worcestersauce 250ml', price: 130, unit: 'bottle', description: 'Vegan & preservative free' },
    { name: 'Nutritional yeast 150g', price: 47, unit: 'pack' },
    { name: 'Ramen noodles - Shoya soup', price: 55, unit: 'pack' },
    { name: 'Ramen noodles - Miso soup', price: 55, unit: 'pack' },
    { name: 'Black beans dry 500g', price: 47, unit: 'pack' },
    { name: 'Chickpeas dry 500g', price: 36, unit: 'pack' },
  ];

  const dairy = [
    { name: 'Jersey full cream yogurt 1L', price: 78, unit: 'bottle' },
    { name: 'Yogurt - Lemon curd 1L', price: 88, unit: 'bottle' },
    { name: 'Yogurt - Strawberry 1L', price: 82, unit: 'bottle' },
    { name: 'Yogurt - Blueberry 1L', price: 82, unit: 'bottle' },
    { name: 'Kefir 1L', price: 68, unit: 'bottle' },
    { name: 'Buttermilk 1L', price: 58, unit: 'bottle' },
    { name: 'Raw milk 750ml (Glass)', price: 42, unit: 'bottle' },
    { name: 'Raw milk 1L (Plastic)', price: 37, unit: 'bottle' },
    { name: 'Raw milk 2L (Plastic)', price: 54, unit: 'bottle' },
    { name: 'Raw milk 2L (Glass)', price: 73, unit: 'bottle', description: 'Includes R20 deposit' },
    { name: 'Ghee 250ml', price: 84, unit: 'jar' },
    { name: 'Ghee 1L', price: 310, unit: 'jar' },
    { name: 'Feta 250ml', price: 62, unit: 'tub' },
    { name: 'Cream cheese 250ml', price: 45, unit: 'tub' },
    { name: 'Haloumi 300g', price: 67, unit: 'pack' },
    { name: 'Paneer 200g', price: 48, unit: 'pack' },
    { name: 'Mozzarella block 300g', price: 55, unit: 'block' },
    { name: 'Grated mozzarella 500g', price: 90, unit: 'pack' },
    { name: 'Young cheddar block 300g', price: 72, unit: 'block' },
    { name: 'Grated cheddar 500g', price: 90, unit: 'pack' },
    { name: 'Boerenkaas 250g', price: 105, unit: 'block' },
    { name: 'Gouda wedge 300g', price: 70, unit: 'wedge' },
    { name: 'Gouda baby round 500g', price: 110, unit: 'round' },
    { name: 'Mature cheddar 300g', price: 90, unit: 'block' },
    { name: 'Jersey cream 250ml', price: 75, unit: 'tub' },
    { name: 'Jersey cream 1L', price: 122, unit: 'bottle' },
    // Montagu
    { name: 'Traditional Feta 200g', price: 58, unit: 'block', description: 'Montagu' },
    { name: 'Haloumi Wedge 200g', price: 70, unit: 'block', description: 'Montagu' },
    { name: 'Wynland Mature Cheddar 7-9m 200g', price: 78, unit: 'block', description: 'Montagu' },
    { name: 'Wynland Mature Cheddar 3-5m 200g', price: 78, unit: 'block', description: 'Montagu' },
    { name: 'Plaaskaas 200g', price: 64, unit: 'block', description: 'Montagu' },
    { name: 'Spotted Black Pepper Boerenkaas 200g', price: 75, unit: 'block', description: 'Montagu' },
    { name: 'Boerenkaas Wedge 200g', price: 70, unit: 'wedge', description: 'Montagu' },
    { name: 'Cumin Seed Boerenkaas 200g', price: 75, unit: 'block', description: 'Montagu' },
    { name: 'Montagu Cream 500ml', price: 65, unit: 'bottle' },
    { name: 'Montagu Cream 1L', price: 98, unit: 'bottle' },
    { name: 'Montagu Buttermilk 1L', price: 45, unit: 'bottle' },
    { name: 'Double Thick Yogurt 750ml', price: 110, unit: 'tub', description: 'Montagu' },
    { name: 'Farm Yogurt 750ml', price: 80, unit: 'tub', description: 'Montagu' },
    { name: 'Raw Farm Milk 2L', price: 58, unit: 'bottle', description: 'Montagu' },
    { name: 'Raw Farm Milk 1L', price: 39, unit: 'bottle', description: 'Montagu' },
    { name: 'Whey 1L', price: 35, unit: 'bottle', description: 'Montagu' },
    { name: 'Raw Butter 500g Salted', price: 110, unit: 'block', description: 'Montagu' },
    { name: 'Raw Butter 500g Unsalted', price: 110, unit: 'block', description: 'Montagu' },
  ];

  const meat = [
    { name: 'Beef Sirloin Steak 2pk (500-600g)', price: 170, unit: 'pack' },
    { name: 'Beef Ribeye Steak (200-250g)', price: 110, unit: 'pack' },
    { name: 'Beef Rump Steak (400-450g)', price: 120, unit: 'pack' },
    { name: 'Beef Sausage 500g', price: 95, unit: 'pack' },
    { name: 'Beef Biltong Sliced 100g', price: 49, unit: 'pack' },
    { name: 'Beef Steak Mince 500g', price: 95, unit: 'pack' },
    { name: 'Beef Burger Patties 4pk', price: 95, unit: 'pack' },
  ];

  const productCategories = [
    { category: 'bakery', items: bakery },
    { category: 'broths', items: broths },
    { category: 'nuts_fruit', items: nuts_fruit },
    { category: 'vegetables', items: vegetables },
    { category: 'fruit', items: fruit },
    { category: 'local_produce', items: local_produce },
    { category: 'plant_based', items: plant_based },
    { category: 'dairy', items: dairy },
    { category: 'meat', items: meat },
  ];

  let totalProducts = 0;
  for (const { category, items } of productCategories) {
    for (const item of items) {
      await prisma.product.upsert({
        where: { name: item.name },
        update: {
          price: item.price,
          category,
          unit: item.unit,
          ...(item.description ? { description: item.description } : {}),
        },
        create: {
          name: item.name,
          price: item.price,
          category,
          unit: item.unit,
          ...(item.description ? { description: item.description } : {}),
          isAvailable: true,
          isSeasonal: false,
        },
      });
      totalProducts++;
    }
  }
  console.log(`✓ Created/Updated ${totalProducts} products across ${productCategories.length} categories`);

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
