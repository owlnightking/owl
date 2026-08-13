import type { JwtPayload } from "@owl/shared";

export interface FeishuUserInfo {
  unionId: string;
  openId: string;
  name: string;
  avatarUrl?: string;
  email?: string;
}

export interface StoredUser {
  id: string;
  unionId: string;
  openId: string;
  name: string;
  avatarUrl: string | null;
  email: string | null;
  status: string;
  roleCodes: string[];
}

export interface UserRepository {
  findById(id: string): Promise<StoredUser | null>;
  findByUnionId(unionId: string): Promise<StoredUser | null>;
  upsertFromFeishu(info: FeishuUserInfo): Promise<StoredUser>;
  list(options: { keyword?: string; page: number; pageSize: number }): Promise<{ items: StoredUser[]; total: number }>;
  assignRoles(userId: string, roleIds: string[]): Promise<void>;
  updateLoginTime(userId: string): Promise<void>;
  findPermissionCodes(userId: string): Promise<string[]>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionRecord {
  jti: string;
  userId: string;
  unionId: string;
  clientName: string;
  expiresAt: number;
  status: "active" | "revoked";
}

export const AUTH_PORT = Symbol("AUTH_PORT");
export const AUTH_SERVICE = Symbol("AUTH_SERVICE");
export const SESSION_STORE_PORT = Symbol("SESSION_STORE_PORT");
export const TOKEN_PORT = Symbol("TOKEN_PORT");
export const USER_REPOSITORY_PORT = Symbol("USER_REPOSITORY_PORT");
export const OAUTH_STATE_STORE_PORT = Symbol("OAUTH_STATE_STORE_PORT");

export interface AuthPort {
  buildAuthorizeUrl(state: string): string;
  exchangeCodeForUser(code: string): Promise<FeishuUserInfo>;
}

export interface OAuthState {
  state: string;
  redirectPath: string;
  createdAt: number;
}

export interface OAuthStateStorePort {
  save(state: OAuthState): Promise<void>;
  findAndConsume(state: string): Promise<OAuthState | null>;
}

export interface SessionStorePort {
  save(session: SessionRecord): Promise<void>;
  find(jti: string): Promise<SessionRecord | null>;
  revoke(jti: string): Promise<void>;
  revokeByUser(userId: string): Promise<void>;
  extend(jti: string, expiresAt: number): Promise<void>;
}

export interface TokenPort {
  signAccess(payload: JwtPayload): Promise<string>;
  signRefresh(payload: JwtPayload): Promise<string>;
  verifyAccess(token: string): Promise<JwtPayload>;
  verifyRefresh(token: string): Promise<JwtPayload>;
}

export interface AuthService {
  buildAuthorizeUrl(redirectPath: string): Promise<string>;
  handleCallback(code: string, state: string): Promise<{ tokens: AuthTokens; redirectPath: string }>;
  refreshSession(refreshToken: string): Promise<AuthTokens>;
  logout(accessToken: string, refreshToken: string): Promise<void>;
  resolveSession(accessToken: string): Promise<{ payload: JwtPayload; user: StoredUser | null }>;
}
