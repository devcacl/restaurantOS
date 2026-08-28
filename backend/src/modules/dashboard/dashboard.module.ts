import { Injectable, Module } from '@nestjs/common';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(restaurantId: string, branchId?: string) {
    const whereOrder: any = { restaurantId };
    if (branchId) whereOrder.branchId = branchId;

    const [orders, activeTables, inventoryItems, products] = await Promise.all([
      this.prisma.order.findMany({
        where: whereOrder,
        include: { items: true },
      }),
      this.prisma.table.count({
        where: branchId ? { branchId, status: 'OCCUPIED' } : { status: 'OCCUPIED' },
      }),
      this.prisma.inventory.findMany({
        where: branchId ? { branchId } : {},
        include: { product: true },
      }),
      this.prisma.product.findMany({
        where: { restaurantId, deletedAt: null },
      }),
    ]);

    const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');
    const sales = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = completedOrders.length > 0 ? sales / completedOrders.length : 0;

    const lowStockProducts = inventoryItems.filter((i) => i.quantity <= i.minimumStock).length;

    // Build chart timeline data
    const salesByDay: Record<string, number> = {};
    completedOrders.forEach((o) => {
      const day = o.createdAt.toISOString().split('T')[0];
      salesByDay[day] = (salesByDay[day] || 0) + o.total;
    });

    const timeline = Object.entries(salesByDay).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    return {
      sales,
      orders: orders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      averageOrderValue,
      activeTables,
      lowStockProducts,
      totalProducts: products.length,
      timeline,
    };
  }
}

@ApiTags('Dashboard & Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Get dashboard KPI analytics' })
  @Get('restaurants/:restaurantId/dashboard')
  async getDashboard(
    @Param('restaurantId') restaurantId: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.dashboardService.getDashboardData(restaurantId, branchId);
    return { data };
  }
}

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
