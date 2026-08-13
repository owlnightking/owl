import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { AUTH_SERVICE, type AuthService } from "../domain/auth.ports";

const ACCESS_COOKIE = "owl_access";

export interface AuthenticatedRequest extends Request {
  auth: { userId: string; unionId: string; client: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AUTH_SERVICE) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const access = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
    if (!access) {
      throw new UnauthorizedException("missing access token");
    }
    const { payload } = await this.authService.resolveSession(access);
    (req as AuthenticatedRequest).auth = {
      userId: payload.sub,
      unionId: payload.name,
      client: payload.client,
    };
    return true;
  }
}
