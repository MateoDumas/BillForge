export interface UserProfileResponse {
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  };
  tenant: {
    id: string;
    name: string;
    apiKey: string | null;
  };
  subscription: {
    planName: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
}

export interface TenantMeResponse {
  tenantId: string;
  userId: string;
  roles: string[];
}

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'grace_period' | 'canceled_auto';

export interface SubscriptionResponse {
  tenantId: string;
  subscription: {
    id: string;
    planId: string;
    status: SubscriptionStatus;
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
    status: SubscriptionStatus;
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
  isUsageBased?: boolean;
  usageMetric?: string | null;
}

export type Plan = PlansResponseItem;
export type PlansResponse = PlansResponseItem[];

export interface StatsResponse {
  totalSpentCents: number;
  currency: string;
}

export interface AdminStatsResponse {
  totalTenants: number;
  activeSubscriptions: number;
  mrrCents: number;
  arrCents: number;
  failedPaymentsCount: number;
  revenueByPlan: {
    name: string;
    revenueCents: number;
    count: number;
  }[];
  currency: string;
}

export interface FailedPayment {
  id: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  status: string;
  tenant_name: string;
  billing_email: string;
}

export interface AdminTenant {
  id: string;
  name: string;
  billing_email: string;
  status: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  event_type: string;
  severity: string;
  message: string;
  metadata: any;
  created_at: string;
  tenant_name?: string;
  user_email?: string;
}

export interface JobLogEntry {
  id: string;
  job_name: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  details?: any;
}
