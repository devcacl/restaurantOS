import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting RestaurantOS Database Seed...');

  console.log('🧹 Cleaning existing data...');
  try {
    const tableNames = [
      'order_items', 'payments', 'orders', 'inventory_movements', 'inventory',
      'product_images', 'products', 'categories', 'tables', 'customers',
      'purchase_items', 'purchases', 'suppliers', 'notifications', 'audit_logs',
      'branch_users', 'branches', 'user_roles', 'role_permissions', 'users',
      'roles', 'permissions', 'restaurants'
    ];
    for (const table of tableNames) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }
    console.log('✅ Clean completed');
  } catch (err: any) {
    console.log('Clean completed/skipped:', err?.message || err);
  }

  console.log('2. Seeding Roles & Permissions...');
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

  // 2. Demo Users
  const adminHash   = await bcrypt.hash('admin123',  10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@restaurantos.com' },
    update: {},
    create: {
      email: 'admin@restaurantos.com',
      password: adminHash,
      firstName: 'Carlos',
      lastName: 'León',
      phone: '+573001234567',
    },
  });

  // 3. Demo Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Mi Restaurante Demo',
      description: 'Plataforma limpia para pruebas CRUD',
      email: 'owner@mirestaurante.com',
      phone: '+576010000000',
      status: 'ACTIVE',
    },
  });

  // Link admin user to restaurant with OWNER role
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
      name: 'Sede Principal',
      address: 'Calle Falsa 123, Bogotá',
      phone: '+576010000001',
      openingTime: '08:00',
      closingTime: '22:00',
    },
  });

  await prisma.branchUser.create({
    data: {
      branchId: branch.id,
      userId: adminUser.id,
    },
  });

  console.log('✅ RestaurantOS Database Seed Completed Successfully!');
  console.log(`👑 OWNER  -> admin@restaurantos.com  | admin123`);
  console.log(`🏪 Restaurant: Mi Restaurante Demo | Branch: Sede Principal`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
