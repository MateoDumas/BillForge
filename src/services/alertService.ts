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
    // In a real implementation, this would send to Slack/PagerDuty
  }

  async notifyCritical(message: string): Promise<void> {
    console.error(`[AlertService] 🔥 CRITICAL ALERT: ${message}`);
    // In a real implementation, this would trigger an immediate page
  }
}

export const alertService = new ConsoleAlertService();
