import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  async findAll(restaurantId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { restaurantId },
      include: {
        user: {
          include: {
            branchUsers: {
              include: {
                branch: true,
              },
            },
          },
        },
        role: true,
      },
    });

    return userRoles.map((ur) => {
      const u = ur.user;
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        status: u.status,
        createdAt: u.createdAt,
        role: ur.role,
        branches: u.branchUsers.map((bu) => bu.branch),
      };
    });
  }

  async findOne(id: string, restaurantId: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: { userId: id, restaurantId },
      include: {
        user: {
          include: {
            branchUsers: {
              include: {
                branch: true,
              },
            },
          },
        },
        role: true,
      },
    });

    if (!userRole) {
      throw new NotFoundException('User not found in this restaurant');
    }

    const u = userRole.user;
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      status: u.status,
      createdAt: u.createdAt,
      role: userRole.role,
      branches: u.branchUsers.map((bu) => bu.branch),
    };
  }

  async create(dto: CreateUserDto, restaurantId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const role = await this.prisma.role.findUnique({
      where: { name: dto.roleName },
    });

    if (!role) {
      throw new BadRequestException(`Role ${dto.roleName} does not exist`);
    }

    let authUserRef: string | undefined = undefined;

    // Create user in Supabase Auth if adminClient is available
    if (this.supabaseService.adminClient) {
      const { data: suData, error: suError } = await this.supabaseService.adminClient.auth.admin.createUser({
        email: dto.email.toLowerCase(),
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          roleName: dto.roleName,
        },
      });

      if (!suError && suData?.user) {
        authUserRef = suData.user.id;
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        authUserRef,
        status: 'ACTIVE',
      },
    });

    // Create UserRole link
    await this.prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        restaurantId,
      },
    });

    // Create Branch link if branchId is provided
    if (dto.branchId) {
      await this.prisma.branchUser.create({
        data: {
          userId: user.id,
          branchId: dto.branchId,
        },
      });
    }

    return this.findOne(user.id, restaurantId);
  }

  async update(id: string, dto: UpdateUserDto, restaurantId: string) {
    // Verify user belongs to this restaurant
    const userRole = await this.prisma.userRole.findFirst({
      where: { userId: id, restaurantId },
      include: { user: true },
    });

    if (!userRole) {
      throw new NotFoundException('User not found in this restaurant');
    }

    // Verify email is not taken by another user if email is being updated
    if (dto.email) {
      const emailTaken = await this.prisma.user.findFirst({
        where: {
          email: dto.email.toLowerCase(),
          NOT: { id },
        },
      });
      if (emailTaken) {
        throw new BadRequestException('A user with this email already exists');
      }
    }

    const targetUser = userRole.user;

    // Update in Supabase Auth if authUserRef exists and adminClient is configured
    if (targetUser.authUserRef && this.supabaseService.adminClient) {
      const supabaseUpdates: any = {};
      if (dto.email) supabaseUpdates.email = dto.email.toLowerCase();
      if (dto.password) supabaseUpdates.password = dto.password;
      if (dto.firstName || dto.lastName) {
        supabaseUpdates.user_metadata = {
          firstName: dto.firstName || targetUser.firstName,
          lastName: dto.lastName || targetUser.lastName,
        };
      }
      if (Object.keys(supabaseUpdates).length > 0) {
        await this.supabaseService.adminClient.auth.admin.updateUserById(
          targetUser.authUserRef,
          supabaseUpdates,
        );
      }
    }

    const updateData: any = {};
    if (dto.email) updateData.email = dto.email.toLowerCase();
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.status) updateData.status = dto.status;
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update role if roleName is provided
    if (dto.roleName) {
      const role = await this.prisma.role.findUnique({
        where: { name: dto.roleName },
      });
      if (!role) {
        throw new BadRequestException(`Role ${dto.roleName} does not exist`);
      }

      // Delete existing role for this user in this restaurant and create new one
      await this.prisma.userRole.deleteMany({
        where: { userId: id, restaurantId },
      });

      await this.prisma.userRole.create({
        data: {
          userId: id,
          roleId: role.id,
          restaurantId,
        },
      });
    }

    // Update branch if branchId is provided or cleared
    if (dto.branchId !== undefined) {
      await this.prisma.branchUser.deleteMany({
        where: { userId: id },
      });

      if (dto.branchId) {
        await this.prisma.branchUser.create({
          data: {
            userId: id,
            branchId: dto.branchId,
          },
        });
      }
    }

    return this.findOne(id, restaurantId);
  }

  async remove(id: string, restaurantId: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const userRole = await this.prisma.userRole.findFirst({
      where: { userId: id, restaurantId },
      include: { user: true },
    });

    if (!userRole) {
      throw new NotFoundException('User not found in this restaurant');
    }

    // Delete in Supabase Auth if linked
    if (userRole.user.authUserRef && this.supabaseService.adminClient) {
      await this.supabaseService.adminClient.auth.admin.deleteUser(userRole.user.authUserRef);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}
