export interface AuthUser {
  userId: string;
  tenantId: string;
  roles: string[];
}

export interface RequestContext {
  auth: AuthUser;
}

