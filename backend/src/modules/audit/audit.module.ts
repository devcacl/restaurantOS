import { Injectable, Module } from '@nestjs/common';
import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async getAuditLogs(restaurantId: string, query: { page?: number; limit?: number; entity?: string; action?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = { restaurantId };
    if (query.entity) where.entity = query.entity;
    if (query.action) where.action = query.action;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
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

  async getNotifications(userId: string, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;

    const data = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { data };
  }

  async markNotificationRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllNotificationsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}

@ApiTags('Audit Logs & Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @ApiOperation({ summary: 'Get restaurant audit logs' })
  @Get('restaurants/:restaurantId/audit-logs')
  async getAuditLogs(
    @Param('restaurantId') restaurantId: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getAuditLogs(restaurantId, {
      entity,
      action,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @ApiOperation({ summary: 'Get user notifications' })
  @Get('notifications')
  async getNotifications(
    @CurrentUser('userId') userId: string,
    @Query('unread') unread?: string,
  ) {
    return this.auditService.getNotifications(userId, unread === 'true');
  }

  @ApiOperation({ summary: 'Mark single notification as read' })
  @Patch('notifications/:id/read')
  async markRead(@Param('id') id: string) {
    const data = await this.auditService.markNotificationRead(id);
    return { data };
  }

  @ApiOperation({ summary: 'Mark all user notifications as read' })
  @Patch('notifications/read-all')
  async markAllRead(@CurrentUser('userId') userId: string) {
    const data = await this.auditService.markAllNotificationsRead(userId);
    return { data };
  }
}

@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
