import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting RestaurantOS Database Seed...');

  // 1. Roles & Permissions
  const rolesData = [
    { name: 'OWNER', description: 'Full Restaurant Owner Permissions' },
    { name: 'ADMIN', description: 'Restaurant Administrator' },
    { name: 'MANAGER', description: 'Branch Manager' },
    { name: 'WAITER', description: 'Floor Waiter Staff' },
    { name: 'COOK', description: 'Kitchen Line Staff' },
    { name: 'INVENTORY_MANAGER', description: 'Stock & Warehouse Manager' },
  ];

  for (const role of rolesData) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const permissionsList = [
    'restaurants.read', 'restaurants.update',
    'branches.create', 'branches.read', 'branches.update',
    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
    'products.create', 'products.read', 'products.update', 'products.delete',
    'orders.create', 'orders.read', 'orders.update', 'orders.cancel',
    'inventory.read', 'inventory.create', 'inventory.adjust',
    'suppliers.create', 'suppliers.read',
    'purchases.create', 'purchases.read', 'purchases.receive',
    'reports.read', 'dashboard.read',
  ];

  for (const pName of permissionsList) {
    await prisma.permission.upsert({
      where: { name: pName },
      update: {},
      create: { name: pName, description: `Permission for ${pName}` },
    });
  }

  // Assign all permissions to OWNER
  const ownerRole = await prisma.role.findUnique({ where: { name: 'OWNER' } });
  const allPermissions = await prisma.permission.findMany();
  for (const p of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: p.id },
    });
  }

  // 2. Demo User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@restaurantos.com' },
    update: {},
    create: {
      email: 'admin@restaurantos.com',
      password: passwordHash,
      firstName: 'Carlos',
      lastName: 'León',
      phone: '+573001234567',
    },
  });

  // 3. Demo Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'El Perrazazo Grill & Bar',
      description: 'Premium Artisan Burgers & Smokehouse Grill',
      email: 'contacto@elperrazazo.com',
      phone: '+576013456789',
      status: 'ACTIVE',
    },
  });

  // Link user to restaurant with OWNER role
  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: ownerRole.id,
      restaurantId: restaurant.id,
    },
  });

  // 4. Branch
  const branch = await prisma.branch.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Sede Chapinero Central',
      address: 'Carrera 13 #57-28, Bogotá',
      phone: '+576013456799',
      openingTime: '11:30',
      closingTime: '23:00',
    },
  });

  await prisma.branchUser.create({
    data: {
      branchId: branch.id,
      userId: adminUser.id,
    },
  });

  // 5. Dining Tables
  for (let i = 1; i <= 10; i++) {
    await prisma.table.create({
      data: {
        branchId: branch.id,
        number: i,
        capacity: i % 2 === 0 ? 4 : 2,
        status: i === 3 || i === 5 ? 'OCCUPIED' : 'AVAILABLE',
      },
    });
  }

  // 6. Categories
  const catBurgers = await prisma.category.create({
    data: { restaurantId: restaurant.id, name: 'Hamburguesas Gourmet', description: '100% Angus Beef & Pan Brioche' },
  });
  const catParrilla = await prisma.category.create({
    data: { restaurantId: restaurant.id, name: 'Parrilla & Carnes', description: 'Cortes premium al carbón' },
  });
  const catDrinks = await prisma.category.create({
    data: { restaurantId: restaurant.id, name: 'Bebidas & Cocteles', description: 'Refrescos, cervezas artesanales y cocteles' },
  });
  const catStarters = await prisma.category.create({
    data: { restaurantId: restaurant.id, name: 'Entradas & Acompañamientos', description: 'Papas, aros de cebolla y entradas' },
  });

  // 7. Products
  const productsData = [
    { categoryId: catBurgers.id, name: 'Classic Perrazazo Burger', sku: 'BURGER-001', price: 28900, description: '200g carne Angus, queso cheddar fundido, tocineta crocante y salsa especial.', minimumStock: 20 },
    { categoryId: catBurgers.id, name: 'Smoky BBQ Bacon Burger', sku: 'BURGER-002', price: 32900, description: 'Doble tocineta caramelizada, aros de cebolla, salsa BBQ ahumada.', minimumStock: 15 },
    { categoryId: catBurgers.id, name: 'Truffle Mushroom Burger', sku: 'BURGER-003', price: 34900, description: 'Champiñones salteados al vino, queso suizo y alioli de trufa negra.', minimumStock: 10 },
    { categoryId: catParrilla.id, name: 'Bife de Chorizo Premium 350g', sku: 'STEAK-001', price: 49900, description: 'Corte magro a la parrilla servido con chimichurri casero.', minimumStock: 12 },
    { categoryId: catParrilla.id, name: 'Baby Beef al Carbón 300g', sku: 'STEAK-002', price: 46900, description: 'Tierna carne de res a las brasas con papa rústica.', minimumStock: 10 },
    { categoryId: catStarters.id, name: 'Papas Rústicas con Trufa & Queso', sku: 'SIDE-001', price: 16900, description: 'Papas doradas bañadas en aceite de trufa y queso parmesano.', minimumStock: 25 },
    { categoryId: catStarters.id, name: 'Aros de Cebolla Crocantes', sku: 'SIDE-002', price: 14900, description: 'Empanados en cerveza artesanal con dip de alioli.', minimumStock: 20 },
    { categoryId: catDrinks.id, name: 'Limonada de Coco Artesanal', sku: 'DRINK-001', price: 12900, description: 'Refrescante limonada cremosita con leche de coco.', minimumStock: 30 },
    { categoryId: catDrinks.id, name: 'Cerveza IPA Artesanal 500ml', sku: 'DRINK-002', price: 15900, description: 'Cerveza de la casa con notas cítricas y lupuladas.', minimumStock: 40 },
  ];

  const createdProducts = [];
  for (const prod of productsData) {
    const created = await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: prod.categoryId,
        name: prod.name,
        sku: prod.sku,
        price: prod.price,
        description: prod.description,
        minimumStock: prod.minimumStock,
        status: 'AVAILABLE',
      },
    });
    createdProducts.push(created);

    // Initial Inventory stock
    const inv = await prisma.inventory.create({
      data: {
        branchId: branch.id,
        productId: created.id,
        quantity: prod.minimumStock + Math.floor(Math.random() * 30),
        minimumStock: prod.minimumStock,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        inventoryId: inv.id,
        type: 'IN',
        quantity: inv.quantity,
        reason: 'Initial Stock Setup',
        createdBy: adminUser.id,
      },
    });
  }

  // 8. Sample Customer
  const customer = await prisma.customer.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Andrés Cepeda',
      email: 'andres@example.com',
      phone: '+573119876543',
    },
  });

  // 9. Sample Active & Completed Orders
  const p1 = createdProducts[0];
  const p2 = createdProducts[1];
  const p3 = createdProducts[5];
  const p4 = createdProducts[7];

  // Active Order on Table 3
  const table3 = await prisma.table.findFirst({ where: { branchId: branch.id, number: 3 } });
  const activeOrder = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      branchId: branch.id,
      tableId: table3.id,
      customerId: customer.id,
      waiterId: adminUser.id,
      status: 'PREPARING',
      subtotal: p1.price * 2 + p3.price,
      total: p1.price * 2 + p3.price,
      notes: 'Sin cebolla en las hamburguesas',
      items: {
        create: [
          { productId: p1.id, productName: p1.name, unitPrice: p1.price, quantity: 2, subtotal: p1.price * 2, notes: 'Sin cebolla' },
          { productId: p3.id, productName: p3.name, unitPrice: p3.price, quantity: 1, subtotal: p3.price },
        ],
      },
    },
  });

  // Completed Historical Order
  const completedOrder = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      branchId: branch.id,
      customerId: customer.id,
      waiterId: adminUser.id,
      status: 'COMPLETED',
      subtotal: p2.price + p4.price * 2,
      total: p2.price + p4.price * 2,
      completedAt: new Date(),
      items: {
        create: [
          { productId: p2.id, productName: p2.name, unitPrice: p2.price, quantity: 1, subtotal: p2.price },
          { productId: p4.id, productName: p4.name, unitPrice: p4.price, quantity: 2, subtotal: p4.price * 2 },
        ],
      },
      payments: {
        create: [
          { amount: p2.price + p4.price * 2, method: 'CARD', status: 'PAID', transactionRef: 'TX-987654321' },
        ],
      },
    },
  });

  console.log('✅ RestaurantOS Database Seed Completed Successfully!');
  console.log(`👤 Admin User Credentials -> Email: admin@restaurantos.com | Password: admin123`);
  console.log(`🏪 Restaurant: El Perrazazo Grill & Bar | Branch: Sede Chapinero Central`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
