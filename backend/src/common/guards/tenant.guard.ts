import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Allow public or bypass if user context not attached
    if (!user) return true;

    // If super admin / platform owner, allow access
    if (user.roles?.includes('OWNER') || user.roles?.includes('ADMIN')) {
      return true;
    }

    const restaurantIdParam =
      request.params.restaurantId || request.body?.restaurantId || request.query?.restaurantId;

    if (restaurantIdParam && user.restaurantId && restaurantIdParam !== user.restaurantId) {
      // 404 to prevent resource existence disclosure
      throw new NotFoundException('Resource not found');
    }

    return true;
  }
}
