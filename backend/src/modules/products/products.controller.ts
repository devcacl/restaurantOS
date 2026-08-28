import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Products & Menu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @ApiOperation({ summary: 'Get restaurant products with filters' })
  @Get('restaurants/:restaurantId/products')
  async findAllByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findAllByRestaurant(restaurantId, {
      categoryId,
      search,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @ApiOperation({ summary: 'Create product in restaurant' })
  @Post('restaurants/:restaurantId/products')
  async create(
    @Param('restaurantId') restaurantId: string,
    @Body() body: any,
  ) {
    const data = await this.productsService.create(restaurantId, body);
    return { data };
  }

  @ApiOperation({ summary: 'Get single product details' })
  @Get('products/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.productsService.findOne(id);
    return { data };
  }

  @ApiOperation({ summary: 'Update product details' })
  @Patch('products/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.productsService.update(id, body);
    return { data };
  }

  @ApiOperation({ summary: 'Soft delete product' })
  @Delete('products/:id')
  async remove(@Param('id') id: string) {
    const data = await this.productsService.remove(id);
    return { data };
  }
}
