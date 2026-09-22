import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { AUTH_SERVICE, type AuthServicePort } from "../domain/auth.ports";

const ACCESS_COOKIE = "owl_access";
const BEARER_PREFIX = "Bearer ";

export interface AuthenticatedRequest extends Request {
  auth: { userId: number; unionId: string; client: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AUTH_SERVICE) private readonly authService: AuthServicePort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const access = this.extractAccessToken(req);
    if (!access) {
      throw new UnauthorizedException("missing access token");
    }
    const { payload } = await this.authService.resolveSession(access);
    (req as AuthenticatedRequest).auth = {
      userId: Number(payload.sub),
      unionId: payload.name,
      client: payload.client,
    };
    return true;
  }

  private extractAccessToken(req: Request): string | undefined {
    const header = req.headers.authorization;
    if (header?.startsWith(BEARER_PREFIX)) {
      const token = header.slice(BEARER_PREFIX.length).trim();
      if (token) return token;
    }
    return (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
  }
}
