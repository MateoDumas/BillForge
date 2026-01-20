export interface EmailService {
  sendDunningEmail(to: string, tenantName: string, invoiceNumber: string, amount: string): Promise<void>;
  sendWelcomeEmail(to: string, tenantName: string): Promise<void>;
}

export class MockEmailService implements EmailService {
  async sendDunningEmail(to: string, tenantName: string, invoiceNumber: string, amount: string): Promise<void> {
    console.log(`[EmailService] 📧 Sending Dunning Email to ${to} (${tenantName})`);
    console.log(`[EmailService] Subject: Action Required: Payment Failed for Invoice ${invoiceNumber}`);
    console.log(`[EmailService] Body: Dear ${tenantName}, we were unable to process your payment of ${amount}. Please update your payment method to avoid service interruption.`);
  }

  async sendWelcomeEmail(to: string, tenantName: string): Promise<void> {
    console.log(`[EmailService] 📧 Sending Welcome Email to ${to}`);
    console.log(`[EmailService] Subject: Welcome to BillForge, ${tenantName}!`);
  }
}

export const emailService = new MockEmailService();
