import { Injectable, NotFoundException, BadRequestException, Module } from '@nestjs/common';
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  // Suppliers
  async findSuppliers(restaurantId: string) {
    const data = await this.prisma.supplier.findMany({
      where: { restaurantId, deletedAt: null },
    });
    return { data };
  }

  async createSupplier(restaurantId: string, data: any) {
    const supplier = await this.prisma.supplier.create({
      data: {
        restaurantId,
        name: data.name,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    });
    return supplier;
  }

  // Purchases
  async findPurchases(branchId: string) {
    const data = await this.prisma.purchase.findMany({
      where: { branchId },
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async createPurchase(branchId: string, userId: string, data: { supplierId: string; items: Array<{ productId: string; quantity: number; unitCost: number }> }) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException('Branch not found');

    let subtotal = 0;
    const purchaseItems = data.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitCost;
      subtotal += itemSubtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: itemSubtotal,
      };
    });

    const purchase = await this.prisma.purchase.create({
      data: {
        restaurantId: branch.restaurantId,
        branchId,
        supplierId: data.supplierId,
        createdBy: userId,
        status: 'DRAFT',
        subtotal,
        total: subtotal,
        items: {
          create: purchaseItems,
        },
      },
      include: { items: true, supplier: true },
    });

    return purchase;
  }

  async receivePurchase(id: string, userId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!purchase) throw new NotFoundException('Purchase order not found');
    if (purchase.status === 'RECEIVED') throw new BadRequestException('Purchase already received');

    return this.prisma.$transaction(async (tx) => {
      // Mark as received
      const updated = await tx.purchase.update({
        where: { id },
        data: { status: 'RECEIVED', receivedAt: new Date() },
      });

      // Stock IN movements
      for (const item of purchase.items) {
        let inv = await tx.inventory.findUnique({
          where: { branchId_productId: { branchId: purchase.branchId, productId: item.productId } },
        });

        if (!inv) {
          inv = await tx.inventory.create({
            data: {
              branchId: purchase.branchId,
              productId: item.productId,
              quantity: 0,
            },
          });
        }

        await tx.inventory.update({
          where: { id: inv.id },
          data: { quantity: inv.quantity + item.quantity },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            type: 'IN',
            quantity: item.quantity,
            reason: `Purchase Order #${purchase.id.slice(0, 8)}`,
            referenceType: 'PURCHASE',
            referenceId: purchase.id,
            createdBy: userId,
          },
        });
      }

      return updated;
    });
  }
}

@ApiTags('Suppliers & Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @Get('restaurants/:restaurantId/suppliers')
  async getSuppliers(@Param('restaurantId') restaurantId: string) {
    return this.purchasesService.findSuppliers(restaurantId);
  }

  @Post('restaurants/:restaurantId/suppliers')
  async createSupplier(@Param('restaurantId') restaurantId: string, @Body() body: any) {
    const data = await this.purchasesService.createSupplier(restaurantId, body);
    return { data };
  }

  @Get('branches/:branchId/purchases')
  async getPurchases(@Param('branchId') branchId: string) {
    return this.purchasesService.findPurchases(branchId);
  }

  @Post('branches/:branchId/purchases')
  async createPurchase(@Param('branchId') branchId: string, @CurrentUser('userId') userId: string, @Body() body: any) {
    const data = await this.purchasesService.createPurchase(branchId, userId, body);
    return { data };
  }

  @Post('purchases/:id/receive')
  async receivePurchase(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    const data = await this.purchasesService.receivePurchase(id, userId);
    return { data };
  }
}

@Module({
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
