export interface TenantMeResponse {
  tenantId: string;
  userId: string;
  roles: string[];
}

export interface SubscriptionResponse {
  tenantId: string;
  subscription: {
    id: string;
    planId: string;
    status: string;
    startDate: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  } | null;
}

export interface CreateSubscriptionResponse {
  tenantId: string;
  subscription: {
    id: string;
    planId: string;
    status: string;
    startDate: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
}

export interface InvoicesResponse {
  tenantId: string;
  total: number;
  page: number;
  totalPages: number;
  invoices: {
    id: string;
    subscriptionId: string | null;
    number: string;
    status: string;
    issueDate: string;
    dueDate: string;
    totalCents: number;
    currency: string;
  }[];
}

export interface PaymentsResponse {
  tenantId: string;
  total: number;
  page: number;
  totalPages: number;
  payments: {
    id: string;
    invoiceId: string;
    status: string;
    amountCents: number;
    currency: string;
    externalPaymentId: string | null;
    createdAt: string;
  }[];
}

export interface PlansResponseItem {
  id: string;
  code: string;
  name: string;
  billingPeriod: string;
  basePriceCents: number;
  currency: string;
}

export type PlansResponse = PlansResponseItem[];

export interface StatsResponse {
  totalSpentCents: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmountCents: number;
  nextBillingDate: string | null;
  nextBillingAmountCents: number | null;
  currency: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

// Admin Types
export interface AdminStatsResponse {
  totalTenants: number;
  activeSubscriptions: number;
  mrrCents: number;
  failedPaymentsCount: number;
  currency: string;
}

export interface FailedPayment {
  id: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  status: string;
  tenantName: string;
  billingEmail: string;
}

export interface AdminTenant {
  id: string;
  name: string;
  email: string;
  status: string;
  joinedAt: string;
  activeSubs: number;
}
