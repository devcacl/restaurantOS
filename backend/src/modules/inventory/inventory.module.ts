import { Injectable, NotFoundException, BadRequestException, Module } from '@nestjs/common';
import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findByBranch(branchId: string, query: { search?: string; lowStock?: boolean; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = { branchId };

    if (query.search) {
      where.product = {
        name: { contains: query.search },
      };
    }

    let items = await this.prisma.inventory.findMany({
      where,
      include: { product: true, movements: { take: 5, orderBy: { createdAt: 'desc' } } },
      orderBy: { updatedAt: 'desc' },
    });

    if (query.lowStock) {
      items = items.filter((item) => item.quantity <= item.minimumStock);
    }

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    return {
      data: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async addMovement(branchId: string, userId: string, data: { productId: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; reason?: string }) {
    if (data.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // Atomic transaction
    return this.prisma.$transaction(async (tx) => {
      let inv = await tx.inventory.findUnique({
        where: { branchId_productId: { branchId, productId: data.productId } },
      });

      if (!inv) {
        const product = await tx.product.findUnique({ where: { id: data.productId } });
        if (!product) throw new NotFoundException('Product not found');

        inv = await tx.inventory.create({
          data: {
            branchId,
            productId: data.productId,
            quantity: 0,
            minimumStock: product.minimumStock,
          },
        });
      }

      let newQuantity = inv.quantity;
      if (data.type === 'IN') {
        newQuantity += data.quantity;
      } else if (data.type === 'OUT') {
        newQuantity = Math.max(0, newQuantity - data.quantity);
      } else if (data.type === 'ADJUSTMENT') {
        newQuantity = data.quantity;
      }

      const updatedInv = await tx.inventory.update({
        where: { id: inv.id },
        data: { quantity: newQuantity },
        include: { product: true },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          inventoryId: inv.id,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
          createdBy: userId,
        },
      });

      // Notification check if stock <= minimumStock
      if (newQuantity <= updatedInv.minimumStock) {
        await tx.notification.create({
          data: {
            userId,
            type: 'LOW_STOCK',
            title: 'Low Stock Warning',
            message: `Product '${updatedInv.product.name}' is at ${newQuantity} units (min: ${updatedInv.minimumStock}).`,
          },
        });
      }

      return { inventory: updatedInv, movement };
    });
  }
}

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'Get branch inventory' })
  @Get('branches/:branchId/inventory')
  async findByBranch(
    @Param('branchId') branchId: string,
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.findByBranch(branchId, {
      search,
      lowStock: lowStock === 'true',
      page: Number(page),
      limit: Number(limit),
    });
  }

  @ApiOperation({ summary: 'Register stock movement' })
  @Post('branches/:branchId/inventory/movements')
  async addMovement(
    @Param('branchId') branchId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: any,
  ) {
    const data = await this.inventoryService.addMovement(branchId, userId, body);
    return { data };
  }
}

@Module({
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
