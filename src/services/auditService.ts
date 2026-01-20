import { pool } from "../db";

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
  tenantId?: string;
  userId?: string;
  eventType: string;
  severity: AuditSeverity;
  message: string;
  metadata?: any;
}

export class AuditService {
  static async log(entry: AuditLogEntry) {
    try {
      const { tenantId, userId, eventType, severity, message, metadata } = entry;
      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, event_type, severity, message, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tenantId || null, userId || null, eventType, severity, message, metadata ? JSON.stringify(metadata) : null]
      );
      
      // Also log to console for dev visibility
      const prefix = `[Audit][${severity.toUpperCase()}]`;
      if (severity === 'error' || severity === 'critical') {
        console.error(`${prefix} ${message}`, metadata || '');
      } else {
        console.log(`${prefix} ${message}`);
      }
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }

  // Helper for system events
  static async logSystem(eventType: string, severity: AuditSeverity, message: string, metadata?: any) {
    return this.log({ eventType, severity, message, metadata });
  }

  static async getLogs(limit: number = 50, offset: number = 0, tenantId?: string) {
    let query = `
      SELECT al.*, t.name as tenant_name, u.email as user_email 
      FROM audit_log al
      LEFT JOIN tenant t ON al.tenant_id = t.id
      LEFT JOIN app_user u ON al.user_id = u.id
    `;
    const params: any[] = [limit, offset];
    
    if (tenantId) {
      query += ` WHERE al.tenant_id = $3`;
      params.push(tenantId);
    }
    
    query += ` ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}
