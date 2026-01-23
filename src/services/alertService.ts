import { AuditService } from "./auditService";

export interface AlertService {
  notifyError(context: string, error: Error | string, metadata?: any): Promise<void>;
  notifyCritical(message: string): Promise<void>;
}

export class ConsoleAlertService implements AlertService {
  async notifyError(context: string, error: Error | string, metadata?: any): Promise<void> {
    const errorMsg = error instanceof Error ? error.message : error;
    console.error(`[AlertService] 🚨 ERROR in ${context}: ${errorMsg}`);
    if (metadata) {
      console.error(`[AlertService] Metadata:`, JSON.stringify(metadata, null, 2));
    }
    
    // Log to AuditService for persistence
    await AuditService.logSystem("system.error", "error", `Error in ${context}: ${errorMsg}`, metadata);
  }

  async notifyCritical(message: string): Promise<void> {
    console.error(`[AlertService] 🔥 CRITICAL ALERT: ${message}`);
    
    // Log to AuditService for persistence
    await AuditService.logSystem("system.critical", "critical", message);
  }
}

export const alertService = new ConsoleAlertService();
