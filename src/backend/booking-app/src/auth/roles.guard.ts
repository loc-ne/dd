// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No roles required
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            throw new ForbiddenException('Bạn cần đăng nhập để truy cập');
        }

        // Nếu endpoint yêu cầu ADMIN role
        if (requiredRoles.includes('ADMIN')) {
            // CHỈ cho phép khi isAdmin = true VÀ isHost = false
            if (user.isAdmin === true && user.isHost !== true) {
                return true;
            }
            throw new ForbiddenException('Bạn không có quyền truy cập Admin Panel');
        }

        // Xử lý các role khác (HOST, GUEST)
        const userRole = user.isAdmin
            ? 'ADMIN'
            : user.isHost
                ? 'HOST'
                : 'GUEST';

        if (!requiredRoles.includes(userRole)) {
            throw new ForbiddenException('Bạn không có quyền truy cập endpoint này');
        }
        return true;
    }
}
