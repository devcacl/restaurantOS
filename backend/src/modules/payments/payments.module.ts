import { Injectable, NotFoundException, BadRequestException, Module } from '@nestjs/common';
import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findByOrder(orderId: string) {
    const data = await this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async processPayment(orderId: string, data: { amount: number; method: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER'; transactionRef?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    const totalPaid = order.payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const remainingBalance = order.total - totalPaid;

    if (data.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (data.amount > remainingBalance + 0.01) {
      throw new BadRequestException(`Payment amount (${data.amount}) exceeds remaining balance (${remainingBalance})`);
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount: Number(data.amount),
        method: data.method || 'CASH',
        status: 'PAID',
        transactionRef: data.transactionRef,
      },
    });

    // Check if fully paid
    const newTotalPaid = totalPaid + Number(data.amount);
    if (newTotalPaid >= order.total - 0.01) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      if (order.tableId) {
        await this.prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    return payment;
  }
}

@ApiTags('Payments & Checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('orders/:orderId/payments')
  async findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }

  @Post('orders/:orderId/payments')
  async processPayment(@Param('orderId') orderId: string, @Body() body: any) {
    const data = await this.paymentsService.processPayment(orderId, body);
    return { data };
  }
}

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
