import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';

export interface UploadedFileDto {
  originalname?: string;
  buffer?: Buffer;
  mimetype?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  async findAllByRestaurant(
    restaurantId: string,
    query: { categoryId?: string; search?: string; status?: string; page?: number; limit?: number },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      restaurantId,
      deletedAt: null,
    };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { sku: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, images: true, inventories: true },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
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
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true, inventories: true },
    });
    if (!product || product.deletedAt) throw new NotFoundException('Product not found');
    return product;
  }

  async create(restaurantId: string, data: any) {
    if (data.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    const existing = await this.prisma.product.findFirst({
      where: { restaurantId, sku: data.sku, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`SKU '${data.sku}' already exists in this restaurant`);
    }

    return this.prisma.product.create({
      data: {
        restaurantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        sku: data.sku,
        price: Number(data.price),
        minimumStock: data.minimumStock ? Number(data.minimumStock) : 5,
        status: data.status || 'AVAILABLE',
      },
    });
  }

  async addProductImage(productId: string, file: UploadedFileDto) {
    const product = await this.findOne(productId);
    if (!file) throw new BadRequestException('No image file provided');

    const imageUrl = await this.supabaseService.uploadProductImage(
      file.originalname || `image_${productId}.jpg`,
      file.buffer || Buffer.from(''),
      file.mimetype || 'image/jpeg',
    );

    const imageCount = await this.prisma.productImage.count({ where: { productId } });

    return this.prisma.productImage.create({
      data: {
        productId: product.id,
        imageUrl,
        position: imageCount + 1,
      },
    });
  }

  async removeProductImage(productId: string, imageId: string) {
    await this.findOne(productId);
    return this.prisma.productImage.delete({ where: { id: imageId } });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    if (data.price !== undefined && data.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  // ─── CATEGORIES ──────────────────────────────────────────────────────────

  async findAllCategories(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(restaurantId: string, data: any) {
    if (!data.name) {
      throw new BadRequestException('Category name is required');
    }
    return this.prisma.category.create({
      data: {
        restaurantId,
        name: data.name,
        description: data.description,
      },
    });
  }

  async updateCategory(id: string, data: any) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async removeCategory(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { products: { where: { deletedAt: null } } },
    });
    if (!existing) throw new NotFoundException('Category not found');

    if (existing.products.length > 0) {
      throw new BadRequestException('Cannot delete category because it contains active products');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
