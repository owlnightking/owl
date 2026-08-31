import { Controller, Get, HttpStatus, Inject, Post, Query, Req, Res, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { IsOptional, IsString } from "class-validator";
import { ok } from "../../../common/response/api-response";
import { AUTH_SERVICE, type AuthService } from "../domain/auth.ports";

export class FeishuLoginQueryDto {
  @IsString()
  redirect!: string;

  @IsString()
  @IsOptional()
  lang?: string;

  @IsString()
  @IsOptional()
  open_in_browser?: string;
}

export class FeishuCallbackQueryDto {
  @IsString()
  code!: string;

  @IsString()
  state!: string;
}

const ACCESS_COOKIE = "owl_access";
const REFRESH_COOKIE = "owl_refresh";

@Controller("auth")
export class AuthController {
  private readonly cookieDomain?: string;
  private readonly secure: boolean;
  private readonly redirectUri: string;

  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthService,
    config: ConfigService
  ) {
    this.cookieDomain = config.get<string>("COOKIE_DOMAIN") ?? undefined;
    this.secure = (config.get<string>("COOKIE_SECURE") ?? "false") === "true";
    this.redirectUri = config.get<string>("FEISHU_REDIRECT_URI") ?? "";
  }

  @Get("feishu/login")
  async feishuLogin(@Query() query: FeishuLoginQueryDto, @Req() req: Request, @Res() res: Response) {
    const redirectUri =
      this.redirectUri ||
      (() => {
        const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol;
        const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
        return `${protocol}://${host}/api/auth/feishu/callback`;
      })();
    const url = await this.authService.buildAuthorizeUrl(query.redirect, redirectUri);
    return res.redirect(url);
  }

  @Get("feishu/callback")
  async feishuCallback(@Query() query: FeishuCallbackQueryDto, @Res() res: Response) {
    const { tokens, redirectPath } = await this.authService.handleCallback(query.code, query.state);
    this.setAuthCookies(res, tokens);
    return res.redirect(redirectPath);
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res() res: Response) {
    const cookieRefresh = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE] ?? "";
    const refreshToken = cookieRefresh;
    if (!refreshToken) {
      throw new UnauthorizedException("missing refresh token");
    }
    const tokens = await this.authService.refreshSession(refreshToken);
    this.setAuthCookies(res, tokens);
    return res.status(HttpStatus.OK).json(ok({ expiresIn: tokens.expiresIn }));
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res() res: Response) {
    const access = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE] ?? "";
    const refresh = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE] ?? "";
    await this.authService.logout(access, refresh);
    this.clearAuthCookies(res);
    return res.status(HttpStatus.OK).json(ok(null, "logged out"));
  }

  @Get("me")
  async me(@Req() req: Request) {
    const access = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE] ?? "";
    const { payload, user } = await this.authService.resolveSession(access);
    return ok({
      sub: payload.sub,
      name: user?.name ?? payload.name,
      unionId: user?.unionId ?? payload.name,
      client: payload.client,
    });
  }

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string; expiresIn: number }) {
    const common = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: this.secure,
      domain: this.cookieDomain,
      path: "/",
    };
    res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...common, maxAge: tokens.expiresIn * 1000 });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...common, maxAge: 3 * 24 * 60 * 60 * 1000 });
  }

  private clearAuthCookies(res: Response) {
    const common = { domain: this.cookieDomain, path: "/" };
    res.clearCookie(ACCESS_COOKIE, common);
    res.clearCookie(REFRESH_COOKIE, common);
  }
}
