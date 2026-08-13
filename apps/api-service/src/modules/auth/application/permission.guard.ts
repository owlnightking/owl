import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { PERMISSIONS_KEY, type AuthPrincipal } from "../presentation/auth.decorators";
import { USER_REPOSITORY_PORT, type UserRepository } from "../domain/auth.ports";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(USER_REPOSITORY_PORT) private readonly users: UserRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request & { auth?: AuthPrincipal }>();
    if (!req.auth) {
      throw new ForbiddenException("missing auth principal");
    }
    const codes = await this.users.findPermissionCodes(req.auth.userId);
    const hasAll = required.every((code) => codes.includes(code));
    if (!hasAll) {
      throw new ForbiddenException("permission denied");
    }
    return true;
  }
}
