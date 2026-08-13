import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Request } from "express";

export const PERMISSIONS_KEY = "owl_required_permissions";

export const RequirePermission = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export interface AuthPrincipal {
  userId: string;
  unionId: string;
  client: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthPrincipal => {
  const req = context.switchToHttp().getRequest<Request & { auth?: AuthPrincipal }>();
  if (!req.auth) {
    throw new Error("CurrentUser 装饰器依赖 JwtAuthGuard，请先应用守卫");
  }
  return req.auth;
});
