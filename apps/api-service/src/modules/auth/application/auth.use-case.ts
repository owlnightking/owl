import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { AUTH, JwtPayload, LoginResult } from "@owl/shared";
import { randomBytes, randomUUID } from "node:crypto";
import {
  AUTH_PORT,
  OAUTH_STATE_STORE_PORT,
  SESSION_STORE_PORT,
  TOKEN_PORT,
  USER_REPOSITORY_PORT,
  type AuthPort,
  type AuthService,
  type AuthTokens,
  type OAuthStateStorePort,
  type SessionRecord,
  type SessionStorePort,
  type StoredUser,
  type TokenPort,
  type UserRepository,
} from "../domain/auth.ports";

interface LoginContext {
  unionId: string;
  clientName: string;
}

const ALLOWED_REDIRECT_PREFIXES = ["/", "/owl/", "/admin/", "/cron/", "/mobile/", "/portal/"];

@Injectable()
export class AuthUseCase implements AuthService {
  constructor(
    @Inject(AUTH_PORT) private readonly feishu: AuthPort,
    @Inject(SESSION_STORE_PORT) private readonly sessionStore: SessionStorePort,
    @Inject(TOKEN_PORT) private readonly tokenService: TokenPort,
    @Inject(USER_REPOSITORY_PORT) private readonly users: UserRepository,
    @Inject(OAUTH_STATE_STORE_PORT) private readonly oauthStateStore: OAuthStateStorePort
  ) {}

  async buildAuthorizeUrl(redirectPath: string, redirectUri: string): Promise<string> {
    const safePath = this.normalizeRedirectPath(redirectPath);
    const state = randomBytes(24).toString("hex");
    await this.oauthStateStore.save({ state, redirectPath: safePath, redirectUri, createdAt: Date.now() });
    return this.feishu.buildAuthorizeUrl(state, redirectUri);
  }

  async handleCallback(code: string, state: string): Promise<{ tokens: AuthTokens; redirectPath: string }> {
    const oauthState = await this.oauthStateStore.findAndConsume(state);
    if (!oauthState) {
      throw new UnauthorizedException("invalid oauth state");
    }
    const user = await this.feishu.exchangeCodeForUser(code, oauthState.redirectUri);
    const stored = await this.users.upsertFromFeishu(user);
    await this.users.updateLoginTime(stored.id);
    const tokens = await this.issueTokens(stored.id, stored.unionId, "owl-web");
    return { tokens, redirectPath: oauthState.redirectPath };
  }

  async loginUser(user: LoginContext, _clientName: string): Promise<LoginResult> {
    const stored = await this.users.findByUnionId(user.unionId);
    if (!stored) {
      throw new UnauthorizedException("user not found");
    }
    await this.users.updateLoginTime(stored.id);
    const tokens = await this.issueTokens(stored.id, stored.unionId, _clientName);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        unionId: stored.unionId,
        openId: stored.openId,
        name: stored.name,
        avatarUrl: stored.avatarUrl ?? undefined,
        email: stored.email ?? undefined,
        principalType: "employee",
      },
    };
  }

  async refreshSession(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.tokenService.verifyRefresh(refreshToken);
    const session = await this.sessionStore.find(payload.jti);
    if (!session || session.status !== "active") {
      throw new UnauthorizedException("session expired");
    }
    const user = await this.users.findById(session.userId);
    if (!user || user.status !== "active") {
      throw new UnauthorizedException("user disabled");
    }
    await this.sessionStore.revoke(session.jti);
    return this.issueTokens(session.userId, session.unionId, session.clientName);
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    try {
      const accessPayload = await this.tokenService.verifyAccess(accessToken);
      await this.sessionStore.revoke(accessPayload.jti);
    } catch {
      // access token 可能已过期，继续尝试 revoke refresh 会话
    }
    try {
      const refreshPayload = await this.tokenService.verifyRefresh(refreshToken);
      await this.sessionStore.revoke(refreshPayload.jti);
    } catch {
      // refresh 无效则忽略，登出幂等
    }
  }

  async resolveSession(accessToken: string): Promise<{ payload: JwtPayload; user: StoredUser | null }> {
    const payload = await this.tokenService.verifyAccess(accessToken);
    const session = await this.sessionStore.find(payload.jti);
    if (!session || session.status !== "active") {
      throw new UnauthorizedException("session revoked");
    }
    const user = await this.users.findById(session.userId);
    return { payload, user };
  }

  private normalizeRedirectPath(redirectPath: string): string {
    if (!redirectPath || redirectPath.startsWith("http") || redirectPath.includes("//")) {
      return "/owl/";
    }
    const normalized = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
    const allowed = ALLOWED_REDIRECT_PREFIXES.some((prefix) => normalized.startsWith(prefix));
    return allowed ? normalized : "/owl/";
  }

  private async issueTokens(userId: string, unionId: string, clientName: string): Promise<AuthTokens> {
    const jti = randomUUID();
    const now = Date.now();
    const accessExp = now + parseTtlMs(AUTH.JWT_ACCESS_TTL);
    const refreshExp = now + parseTtlMs(AUTH.JWT_REFRESH_TTL);
    const base: JwtPayload = {
      sub: userId,
      name: unionId,
      client: clientName,
      iat: Math.floor(now / 1000),
      exp: Math.floor(accessExp / 1000),
      jti,
    };
    const session: SessionRecord = {
      jti,
      userId,
      unionId,
      clientName,
      expiresAt: refreshExp,
      status: "active",
    };
    await this.sessionStore.save(session);
    const accessToken = await this.tokenService.signAccess(base);
    const refreshToken = await this.tokenService.signRefresh({ ...base, exp: Math.floor(refreshExp / 1000) });
    return { accessToken, refreshToken, expiresIn: Math.floor((accessExp - now) / 1000) };
  }
}

export function parseTtlMs(ttl: string): number {
  const m = ttl.match(/^(\d+)([smhd])$/);
  if (!m) {
    return 2 * 60 * 60 * 1000;
  }
  const value = Number(m[1]);
  const unit = m[2];
  const multiplier = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[unit] ?? 60 * 1000;
  return value * multiplier;
}
