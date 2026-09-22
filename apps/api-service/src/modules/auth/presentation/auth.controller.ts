import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { IsOptional, IsString } from "class-validator";
import { ok } from "../../../common/response/api-response";
import { AUTH_SERVICE, USER_REPOSITORY_PORT, type AuthServicePort, type UserRepository } from "../domain/auth.ports";
import { LoginVo, MeVo, MockUserVo, TokenVo } from "./auth.vo";

export class FeishuLoginQueryDto {
  @ApiProperty({ description: "登录成功后的目标路径", example: "/owl/" })
  @IsString()
  redirect!: string;

  @ApiPropertyOptional({ description: "语言", example: "zh-CN" })
  @IsString()
  @IsOptional()
  lang?: string;

  @ApiPropertyOptional({ description: "是否在浏览器中打开", example: "true" })
  @IsString()
  @IsOptional()
  open_in_browser?: string;
}

export class FeishuCallbackQueryDto {
  @ApiProperty({ description: "飞书授权码" })
  @IsString()
  code!: string;

  @ApiProperty({ description: "OAuth state" })
  @IsString()
  state!: string;
}

export class MockLoginDto {
  @ApiProperty({ description: "飞书 unionId" })
  @IsString()
  unionId!: string;

  @ApiPropertyOptional({ description: "客户端标识", example: "owl-web" })
  @IsOptional()
  @IsString()
  clientName?: string;
}

const ACCESS_COOKIE = "owl_access";
const REFRESH_COOKIE = "owl_refresh";

@ApiTags("认证")
@Controller("auth")
export class AuthController {
  private readonly cookieDomain?: string;
  private readonly secure: boolean;
  private readonly isProd: boolean;

  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthServicePort,
    @Inject(USER_REPOSITORY_PORT) private readonly users: UserRepository,
    config: ConfigService
  ) {
    this.cookieDomain = config.get<string>("COOKIE_DOMAIN") ?? undefined;
    this.secure = (config.get<string>("COOKIE_SECURE") ?? "false") === "true";
    this.isProd = config.get<string>("NODE_ENV") === "production";
  }

  @Get("feishu/login")
  @ApiOperation({ summary: "跳转飞书授权登录" })
  @ApiOkResponse({ description: "重定向到飞书授权页" })
  async feishuLogin(@Query() query: FeishuLoginQueryDto, @Req() req: Request, @Res() res: Response) {
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol;
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
    const redirectUri = `${protocol}://${host}/api/auth/feishu/callback`;
    const url = await this.authService.buildAuthorizeUrl(query.redirect, redirectUri);
    return res.redirect(url);
  }

  @Get("feishu/callback")
  @ApiOperation({ summary: "飞书授权回调" })
  @ApiOkResponse({ description: "授权成功后重定向到目标页" })
  async feishuCallback(@Query() query: FeishuCallbackQueryDto, @Res() res: Response) {
    const { tokens, redirectPath } = await this.authService.handleCallback(query.code, query.state);
    this.setAuthCookies(res, tokens);
    return res.redirect(redirectPath);
  }

  @Post("refresh")
  @ApiOperation({ summary: "刷新登录态" })
  @ApiCreatedResponse({ description: "刷新成功", type: TokenVo })
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
  @ApiOperation({ summary: "退出登录" })
  @ApiCreatedResponse({ description: "退出成功" })
  async logout(@Req() req: Request, @Res() res: Response) {
    const access = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE] ?? "";
    const refresh = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE] ?? "";
    await this.authService.logout(access, refresh);
    this.clearAuthCookies(res);
    return res.status(HttpStatus.OK).json(ok(null, "logged out"));
  }

  @Get("me")
  @ApiOperation({ summary: "获取当前登录用户信息" })
  @ApiOkResponse({ description: "当前登录用户信息", type: MeVo })
  async me(@Req() req: Request) {
    const access = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE] ?? "";
    const { payload, user } = await this.authService.resolveSession(access);
    let permissions: string[] = [];
    if (user?.id) {
      permissions = await this.users.findPermissionCodes(user.id);
    }
    return ok({
      sub: payload.sub,
      name: user?.name ?? payload.name,
      unionId: user?.unionId ?? payload.name,
      avatarUrl: user?.avatarUrl ?? null,
      client: payload.client,
      permissions,
    });
  }

  @Post("mock-login")
  @ApiOperation({ summary: "模拟登录（非生产环境）" })
  @ApiCreatedResponse({ description: "模拟登录成功", type: LoginVo })
  async mockLogin(@Body() dto: MockLoginDto, @Res() res: Response) {
    if (this.isProd) {
      throw new UnauthorizedException("mock login disabled in production");
    }
    const clientName = dto.clientName ?? "owl-web";
    const result = await this.authService.loginUser({ unionId: dto.unionId }, clientName);
    this.setAuthCookies(res, result);
    return res.status(HttpStatus.OK).json(ok(result));
  }

  @Get("mock-users")
  @ApiOperation({ summary: "模拟用户列表（非生产环境）" })
  @ApiOkResponse({ description: "模拟用户列表", type: [MockUserVo] })
  async mockUsers() {
    if (this.isProd) {
      throw new UnauthorizedException("mock users disabled in production");
    }
    const { items } = await this.users.list({ page: 1, pageSize: 100 });
    return ok(
      items.map((u) => ({
        id: u.id,
        unionId: u.unionId,
        name: u.name,
        avatarUrl: u.avatarUrl,
        status: u.status,
      }))
    );
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
