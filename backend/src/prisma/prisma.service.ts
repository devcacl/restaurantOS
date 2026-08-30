import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.ensureInitialSetup();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Auto-initialize system roles, default restaurant, and branch if database is fresh.
   */
  async ensureInitialSetup() {
    try {
      // 1. Ensure basic roles exist
      const defaultRoles = [
        { name: 'OWNER', description: 'Restaurant Owner - Full Access' },
        { name: 'ADMIN', description: 'Administrator - System Management' },
        { name: 'MANAGER', description: 'Branch Manager - Operational Access' },
        { name: 'WAITER', description: 'Waiter - POS & Table Orders' },
        { name: 'COOK', description: 'Kitchen Staff - KDS Display' },
        { name: 'INVENTORY_MANAGER', description: 'Inventory Manager' },
      ];

      for (const r of defaultRoles) {
        await this.role.upsert({
          where: { name: r.name },
          update: {},
          create: r,
        });
      }

      // 2. Ensure default Restaurant exists
      let restaurant = await this.restaurant.findFirst({ where: { status: 'ACTIVE' } });
      if (!restaurant) {
        restaurant = await this.restaurant.create({
          data: {
            name: 'El Perrazazo Grill & Bar',
            description: 'Restaurante Principal OS',
            email: 'contacto@elperrazazo.com',
            phone: '+573001234567',
            status: 'ACTIVE',
          },
        });
        this.logger.log(`Created default restaurant: ${restaurant.name}`);
      }

      // 3. Ensure default Branch exists
      let branch = await this.branch.findFirst({ where: { restaurantId: restaurant.id, status: 'ACTIVE' } });
      if (!branch) {
        branch = await this.branch.create({
          data: {
            restaurantId: restaurant.id,
            name: 'Sede Principal',
            address: 'Calle 100 #15-20',
            phone: '+573001234567',
            status: 'ACTIVE',
          },
        });
        this.logger.log(`Created default branch: ${branch.name}`);
      }
    } catch (err: any) {
      this.logger.warn(`Initial setup check failed: ${err.message}`);
    }
  }
}

