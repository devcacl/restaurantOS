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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ProductsService, UploadedFileDto } from './products.service';
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

  @ApiOperation({ summary: 'Upload product image to Supabase Storage' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Post('products/:id/images')
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: UploadedFileDto,
  ) {
    const data = await this.productsService.addProductImage(id, file);
    return { data };
  }

  @ApiOperation({ summary: 'Delete product image' })
  @Delete('products/:productId/images/:imageId')
  async deleteImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    const data = await this.productsService.removeProductImage(productId, imageId);
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

  // ─── CATEGORIES ENDPOINTS ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get restaurant categories' })
  @Get('restaurants/:restaurantId/categories')
  async findAllCategories(@Param('restaurantId') restaurantId: string) {
    const data = await this.productsService.findAllCategories(restaurantId);
    return { data };
  }

  @ApiOperation({ summary: 'Create category in restaurant' })
  @Post('restaurants/:restaurantId/categories')
  async createCategory(
    @Param('restaurantId') restaurantId: string,
    @Body() body: any,
  ) {
    const data = await this.productsService.createCategory(restaurantId, body);
    return { data };
  }

  @ApiOperation({ summary: 'Update category details' })
  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: any) {
    const data = await this.productsService.updateCategory(id, body);
    return { data };
  }

  @ApiOperation({ summary: 'Delete category' })
  @Delete('categories/:id')
  async removeCategory(@Param('id') id: string) {
    const data = await this.productsService.removeCategory(id);
    return { data };
  }
}
