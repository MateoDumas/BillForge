export interface AuthUser {
  userId: string;
  tenantId: string;
  roles: string[];
}

export interface RequestContext {
  auth: AuthUser;
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  GRACE_PERIOD = 'grace_period',
  CANCELED_AUTO = 'canceled_auto',
}

