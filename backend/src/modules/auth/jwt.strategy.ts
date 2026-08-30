import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-restaurant-os-key-2026',
    });
  }

  async validate(payload: any) {
    let user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account inactive or missing');
    }

    // Auto-assign default OWNER role and Restaurant context if user has no role assigned yet
    if (user.userRoles.length === 0) {
      const ownerRole = await this.prisma.role.findUnique({ where: { name: 'OWNER' } });
      const restaurant = await this.prisma.restaurant.findFirst({ where: { status: 'ACTIVE' } });
      const branch = await this.prisma.branch.findFirst({ where: { restaurantId: restaurant?.id, status: 'ACTIVE' } });

      if (ownerRole && restaurant) {
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: ownerRole.id,
            restaurantId: restaurant.id,
          },
        });
        if (branch) {
          await this.prisma.branchUser.create({
            data: {
              userId: user.id,
              branchId: branch.id,
            },
          });
        }
        // Re-fetch user with userRoles
        const refreshed = await this.prisma.user.findUnique({
          where: { id: user.id },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
        if (refreshed) user = refreshed;
      }
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const restaurantId = user.userRoles[0]?.restaurantId || null;
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name),
        ),
      ),
    );

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      restaurantId,
      roles,
      permissions,
    };
  }
}

