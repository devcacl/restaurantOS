import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders & POS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Get branch orders with status filter' })
  @Get('branches/:branchId/orders')
  async findAllByBranch(
    @Param('branchId') branchId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAllByBranch(branchId, {
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @ApiOperation({ summary: 'Create a new order in POS' })
  @Post('branches/:branchId/orders')
  async create(
    @Param('branchId') branchId: string,
    @CurrentUser('userId') waiterId: string,
    @Body() body: any,
  ) {
    const data = await this.ordersService.create(branchId, waiterId, body);
    return { data };
  }

  @ApiOperation({ summary: 'Get single order detail' })
  @Get('orders/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.ordersService.findOne(id);
    return { data };
  }

  @ApiOperation({ summary: 'Update order transition status' })
  @Patch('orders/:id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const data = await this.ordersService.updateStatus(id, body.status);
    return { data };
  }
}
