import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service.js';

/**
 * Middleware to log admin actions
 */
export const auditLog = (action: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Store original send function
    const originalSend = res.send;

    // Override send to capture response
    res.send = function (data: unknown): Response {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Extract resource ID from params or body
        const resourceId = req.params.id || req.params.orderId || req.params.customerId || (req.body as { id?: string }).id;

        // Log the action asynchronously (don't wait)
        void auditService.log({
          userId: req.user?.userId,
          action,
          resource,
          resourceId,
          details: JSON.stringify({
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
          }),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }).catch((error: unknown) => {
          console.error('Audit logging failed:', error);
        });
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
};
