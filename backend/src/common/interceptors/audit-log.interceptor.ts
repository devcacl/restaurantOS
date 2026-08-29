import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // Only log state mutation operations (POST, PATCH, PUT, DELETE)
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = req.user;
    const path = req.path || '';

    // Infer entity from path
    let entity = 'UNKNOWN';
    if (path.includes('orders')) entity = 'ORDER';
    else if (path.includes('products')) entity = 'PRODUCT';
    else if (path.includes('inventory')) entity = 'INVENTORY';
    else if (path.includes('purchases')) entity = 'PURCHASE';
    else if (path.includes('restaurants')) entity = 'RESTAURANT';

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              restaurantId: user?.restaurantId || null,
              userId: user?.userId || null,
              action: method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : 'UPDATE',
              entity,
              entityId: response?.data?.id || null,
              newValues: JSON.stringify(req.body || {}),
              ipAddress: req.ip || req.connection?.remoteAddress,
              userAgent: req.headers?.['user-agent'] || '',
            },
          });
        } catch (e) {
          console.warn('AuditLogInterceptor write skipped:', e);
        }
      }),
    );
  }
}
