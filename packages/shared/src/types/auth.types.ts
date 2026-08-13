export type PrincipalType = "employee" | "contractor" | "service_account";

export interface AuthUser {
  unionId: string;
  openId: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  principalType: PrincipalType;
}

export interface JwtPayload {
  sub: string;
  name: string;
  client: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface AuthSession {
  sessionId: string;
  unionId: string;
  clientName: string;
  createdAt: number;
  expiresAt: number;
  status: "active" | "revoked";
  lastUsedAt: number;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresIn: number;
}
