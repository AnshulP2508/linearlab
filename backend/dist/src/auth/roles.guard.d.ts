import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SecurityMonitorService } from '../common/security-monitor.service';
export declare class RolesGuard implements CanActivate {
    private reflector;
    private readonly monitor;
    constructor(reflector: Reflector, monitor: SecurityMonitorService);
    canActivate(context: ExecutionContext): boolean;
}
