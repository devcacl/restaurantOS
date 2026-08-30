import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isValid = (await super.canActivate(context)) as boolean;
      if (isValid) return true;
    } catch (passportErr) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const supabaseUser = await this.supabaseService.verifySupabaseToken(token);
        if (supabaseUser && supabaseUser.email) {
          let user = await this.prisma.user.findFirst({
            where: {
              OR: [
                { authUserRef: supabaseUser.id },
                { email: supabaseUser.email.toLowerCase() },
              ],
            },
            include: {
              userRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: { permission: true },
                      },
                    },
                  },
                },
              },
            },
          });

          if (!user) {
            user = await this.prisma.user.create({
              data: {
                email: supabaseUser.email.toLowerCase(),
                authUserRef: supabaseUser.id,
                firstName: supabaseUser.user_metadata?.firstName || 'Owner',
                lastName: supabaseUser.user_metadata?.lastName || 'User',
                status: 'ACTIVE',
              },
              include: {
                userRoles: {
                  include: {
                    role: {
                      include: {
                        rolePermissions: {
                          include: { permission: true },
                        },
                      },
                    },
                  },
                },
              },
            });
          }

          if (user && user.userRoles.length === 0) {
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
              const refreshed = await this.prisma.user.findUnique({
                where: { id: user.id },
                include: {
                  userRoles: {
                    include: {
                      role: {
                        include: {
                          rolePermissions: {
                            include: { permission: true },
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

          if (user && user.status === 'ACTIVE') {
            const roles = user.userRoles.map((ur) => ur.role.name);
            const restaurantId = user.userRoles[0]?.restaurantId || null;
            const permissions = Array.from(
              new Set(
                user.userRoles.flatMap((ur) =>
                  ur.role.rolePermissions.map((rp) => rp.permission.name),
                ),
              ),
            );

            request.user = {
              userId: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              restaurantId,
              roles,
              permissions,
            };
            return true;
          }
        }
      }
      throw new UnauthorizedException('Authentication token missing or invalid');
    }
    return true;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication token missing or invalid');
    }
    return user;
  }
}

