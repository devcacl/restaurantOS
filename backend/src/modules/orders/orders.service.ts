import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DELIVERED', 'COMPLETED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async findAllByBranch(branchId: string, query: { status?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = { branchId };
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          table: true,
          customer: true,
          waiter: true,
          items: true,
          payments: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        customer: true,
        waiter: true,
        items: true,
        payments: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(branchId: string, waiterId: string, data: { tableId?: string; customerId?: string; items: Array<{ productId: string; quantity: number; notes?: string }>; notes?: string }) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException('Branch not found');

    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Order must contain at least one product item');
    }

    const productIds = data.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItemsData = data.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      return {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        notes: item.notes,
      };
    });

    const total = subtotal;

    const order = await this.prisma.order.create({
      data: {
        restaurantId: branch.restaurantId,
        branchId: branch.id,
        tableId: data.tableId,
        customerId: data.customerId,
        waiterId,
        subtotal,
        total,
        notes: data.notes,
        status: 'PENDING',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    if (data.tableId) {
      await this.prisma.table.update({
        where: { id: data.tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    // Broadcast Realtime Event
    this.realtimeGateway.emitOrderUpdate(branchId, order);

    return order;
  }

  async updateStatus(id: string, newStatus: string) {
    const order = await this.findOne(id);
    const allowed = VALID_TRANSITIONS[order.status] || [];

    if (!allowed.includes(newStatus)) {
      throw new UnprocessableEntityException(
        `Invalid order status transition from ${order.status} to ${newStatus}`,
      );
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'COMPLETED') updateData.completedAt = new Date();
    if (newStatus === 'CANCELLED') updateData.cancelledAt = new Date();

    const updated = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true, table: true },
    });

    if ((newStatus === 'COMPLETED' || newStatus === 'CANCELLED') && order.tableId) {
      const remainingOrders = await this.prisma.order.count({
        where: {
          tableId: order.tableId,
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'] },
        },
      });

      if (remainingOrders === 0) {
        await this.prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    // Broadcast Realtime Event to KDS & POS
    this.realtimeGateway.emitOrderUpdate(order.branchId, updated);

    return updated;
  }
}
