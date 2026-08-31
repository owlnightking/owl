import { describe, expect, it, vi } from "vitest";
import { AuthUseCase } from "./auth.use-case";
import type { AuthPort, OAuthStateStorePort, SessionStorePort, TokenPort, UserRepository } from "../domain/auth.ports";

function buildMocks() {
  const feishu: AuthPort = {
    buildAuthorizeUrl: vi.fn(() => "https://open.feishu.cn/authorize?state=abc"),
    exchangeCodeForUser: vi.fn(async () => ({
      unionId: "union-1",
      openId: "open-1",
      name: "张三",
      avatarUrl: "https://avatar",
      email: "zhangsan@owl.io",
    })),
  };
  const sessionStore: SessionStorePort = {
    save: vi.fn(async () => {}),
    find: vi.fn(async () => null),
    revoke: vi.fn(async () => {}),
    revokeByUser: vi.fn(async () => {}),
    extend: vi.fn(async () => {}),
  };
  const tokenService: TokenPort = {
    signAccess: vi.fn(async (p) => `access-${p.jti}`),
    signRefresh: vi.fn(async (p) => `refresh-${p.jti}`),
    verifyAccess: vi.fn(async () => ({ sub: "u1", name: "union-1", client: "owl-web", iat: 1, exp: 2, jti: "j1" })),
    verifyRefresh: vi.fn(async () => ({ sub: "u1", name: "union-1", client: "owl-web", iat: 1, exp: 2, jti: "j1" })),
  };
  const users: UserRepository = {
    findById: vi.fn(async () => ({
      id: "u1",
      unionId: "union-1",
      openId: "open-1",
      name: "张三",
      avatarUrl: null,
      email: null,
      status: "active",
      roleCodes: ["business_user"],
    })),
    findByUnionId: vi.fn(async () => null),
    upsertFromFeishu: vi.fn(async () => ({
      id: "u1",
      unionId: "union-1",
      openId: "open-1",
      name: "张三",
      avatarUrl: "https://avatar",
      email: "zhangsan@owl.io",
      status: "active",
      roleCodes: [],
    })),
    list: vi.fn(async () => ({ items: [], total: 0 })),
    assignRoles: vi.fn(async () => {}),
    updateLoginTime: vi.fn(async () => {}),
    findPermissionCodes: vi.fn(async () => ["user:read"]),
  };
  const oauthStateStore: OAuthStateStorePort = {
    save: vi.fn(async () => {}),
    findAndConsume: vi.fn(async () => ({
      state: "state-1",
      redirectPath: "/owl/",
      redirectUri: "http://localhost:3000/api/auth/feishu/callback",
      createdAt: Date.now(),
    })),
  };
  const useCase = new AuthUseCase(feishu, sessionStore, tokenService, users, oauthStateStore);
  return { feishu, sessionStore, tokenService, users, oauthStateStore, useCase };
}

describe("AuthUseCase", () => {
  describe("buildAuthorizeUrl", () => {
    it("保存 oauth state 并返回带 state 的授权地址", async () => {
      const { oauthStateStore, feishu, useCase } = buildMocks();
      const url = await useCase.buildAuthorizeUrl("/owl/", "http://localhost:3000/api/auth/feishu/callback");
      expect(url).toContain("state=");
      expect(oauthStateStore.save).toHaveBeenCalledWith(expect.objectContaining({ redirectPath: "/owl/" }));
      expect(feishu.buildAuthorizeUrl).toHaveBeenCalledOnce();
    });

    it("将外部 URL 重定向路径回退到默认 /owl/", async () => {
      const { oauthStateStore, useCase } = buildMocks();
      await useCase.buildAuthorizeUrl("https://evil.com/phish", "http://localhost:3000/api/auth/feishu/callback");
      expect(oauthStateStore.save).toHaveBeenCalledWith(expect.objectContaining({ redirectPath: "/owl/" }));
    });

    it("将不在白名单的前缀回退到默认 /owl/", async () => {
      const { oauthStateStore, useCase } = buildMocks();
      await useCase.buildAuthorizeUrl("/other/", "http://localhost:3000/api/auth/feishu/callback");
      expect(oauthStateStore.save).toHaveBeenCalledWith(expect.objectContaining({ redirectPath: "/owl/" }));
    });
  });

  describe("handleCallback", () => {
    it("成功路径：消费 state、换用户、签发双 token、返回可信跳转", async () => {
      const { oauthStateStore, feishu, sessionStore, tokenService, users, useCase } = buildMocks();
      const result = await useCase.handleCallback("code-1", "state-1");
      expect(oauthStateStore.findAndConsume).toHaveBeenCalledWith("state-1");
      expect(feishu.exchangeCodeForUser).toHaveBeenCalledWith(
        "code-1",
        "http://localhost:3000/api/auth/feishu/callback"
      );
      expect(users.upsertFromFeishu).toHaveBeenCalled();
      expect(users.updateLoginTime).toHaveBeenCalledWith("u1");
      expect(sessionStore.save).toHaveBeenCalled();
      expect(tokenService.signAccess).toHaveBeenCalledOnce();
      expect(tokenService.signRefresh).toHaveBeenCalledOnce();
      expect(result.tokens.accessToken).toContain("access-");
      expect(result.tokens.refreshToken).toContain("refresh-");
      expect(result.redirectPath).toBe("/owl/");
    });

    it("失败路径：非法 state 抛 UnauthorizedException 且不调用飞书", async () => {
      const { oauthStateStore, feishu, useCase } = buildMocks();
      vi.mocked(oauthStateStore.findAndConsume).mockResolvedValueOnce(null);
      await expect(useCase.handleCallback("code-1", "bad-state")).rejects.toThrow("invalid oauth state");
      expect(feishu.exchangeCodeForUser).not.toHaveBeenCalled();
    });
  });

  describe("refreshSession", () => {
    it("成功路径：刷新会话并轮换双 token", async () => {
      const { sessionStore, useCase } = buildMocks();
      vi.mocked(sessionStore.find).mockResolvedValueOnce({
        jti: "j1",
        userId: "u1",
        unionId: "union-1",
        clientName: "owl-web",
        expiresAt: Date.now() + 10000,
        status: "active",
      });
      const result = await useCase.refreshSession("refresh-token");
      expect(result.accessToken).toContain("access-");
      expect(result.refreshToken).toContain("refresh-");
      expect(sessionStore.revoke).toHaveBeenCalledWith("j1");
    });

    it("失败路径：会话不存在抛 UnauthorizedException", async () => {
      const { sessionStore, useCase } = buildMocks();
      vi.mocked(sessionStore.find).mockResolvedValueOnce(null);
      await expect(useCase.refreshSession("refresh-token")).rejects.toThrow("session expired");
    });

    it("失败路径：用户被禁用抛 UnauthorizedException", async () => {
      const { sessionStore, users, useCase } = buildMocks();
      vi.mocked(sessionStore.find).mockResolvedValueOnce({
        jti: "j1",
        userId: "u1",
        unionId: "union-1",
        clientName: "owl-web",
        expiresAt: Date.now() + 10000,
        status: "active",
      });
      vi.mocked(users.findById).mockResolvedValueOnce({
        id: "u1",
        unionId: "union-1",
        openId: "open-1",
        name: "张三",
        avatarUrl: null,
        email: null,
        status: "disabled",
        roleCodes: [],
      });
      await expect(useCase.refreshSession("refresh-token")).rejects.toThrow("user disabled");
    });
  });

  describe("resolveSession", () => {
    it("成功路径：返回 session payload", async () => {
      const { sessionStore, useCase } = buildMocks();
      vi.mocked(sessionStore.find).mockResolvedValueOnce({
        jti: "j1",
        userId: "u1",
        unionId: "union-1",
        clientName: "owl-web",
        expiresAt: Date.now() + 10000,
        status: "active",
      });
      const result = await useCase.resolveSession("access-token");
      expect(result.payload.sub).toBe("u1");
      expect(result.user?.name).toBe("张三");
    });

    it("失败路径：session 被吊销抛 UnauthorizedException", async () => {
      const { sessionStore, useCase } = buildMocks();
      vi.mocked(sessionStore.find).mockResolvedValueOnce(null);
      await expect(useCase.resolveSession("access-token")).rejects.toThrow("session revoked");
    });
  });
});
