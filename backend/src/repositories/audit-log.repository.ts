import { BaseRepository } from '../lib/firestore-repo.js';

export interface AuditLog {
    id: string;
    userId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    details?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date;
}

export class AuditLogRepository extends BaseRepository<AuditLog> {
    constructor() {
        super('audit_logs');
    }
}

export const auditLogRepository = new AuditLogRepository();
