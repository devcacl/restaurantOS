import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Fetch restaurants linked to user
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { restaurant: true },
    });

    const restaurants = userRoles.map((ur) => ur.restaurant).filter(Boolean);
    const total = restaurants.length;

    return {
      data: restaurants.slice(skip, skip + limit),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        branches: true,
        categories: true,
      },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async create(userId: string, data: { name: string; description?: string; email?: string; phone?: string }) {
    const restaurant = await this.prisma.restaurant.create({
      data: {
        name: data.name,
        description: data.description,
        email: data.email,
        phone: data.phone,
      },
    });

    // Ensure OWNER role exists
    let ownerRole = await this.prisma.role.findUnique({ where: { name: 'OWNER' } });
    if (!ownerRole) {
      ownerRole = await this.prisma.role.create({
        data: { name: 'OWNER', description: 'Restaurant Owner' },
      });
    }

    // Link user as owner
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId: ownerRole.id,
        restaurantId: restaurant.id,
      },
    });

    // Create default branch
    await this.prisma.branch.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Main Branch',
        address: 'Main Street #123',
      },
    });

    return restaurant;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.restaurant.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.restaurant.update({
      where: { id },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    });
  }
}
