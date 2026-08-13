import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { JwtPayload } from "@owl/shared";
import type { TokenPort } from "../domain/auth.ports";

@Injectable()
export class JwtTokenService implements TokenPort {
  private readonly secret: string;

  constructor(
    private readonly jwtService: JwtService,
    config: ConfigService
  ) {
    this.secret = config.get<string>("JWT_SECRET") ?? "dev-secret-change-me";
  }

  async signAccess(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, { secret: this.secret });
  }

  async signRefresh(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, { secret: this.secret });
  }

  async verifyAccess(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, { secret: this.secret });
    } catch {
      throw new UnauthorizedException("invalid access token");
    }
  }

  async verifyRefresh(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, { secret: this.secret });
    } catch {
      throw new UnauthorizedException("invalid refresh token");
    }
  }
}
