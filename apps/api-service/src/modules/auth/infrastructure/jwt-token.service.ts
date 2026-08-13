import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { JwtPayload } from "@owl/shared";
import type { TokenPort } from "../domain/auth.ports";

@Injectable()
export class JwtTokenService implements TokenPort {
  private readonly secret: string;
  private readonly accessTtl: string;
  private readonly refreshTtl: string;

  constructor(
    private readonly jwtService: JwtService,
    config: ConfigService
  ) {
    this.secret = config.get<string>("JWT_SECRET") ?? "dev-secret-change-me";
    this.accessTtl = config.get<string>("JWT_ACCESS_TTL") ?? "2h";
    this.refreshTtl = config.get<string>("JWT_REFRESH_TTL") ?? "3d";
  }

  async signAccess(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, { secret: this.secret, expiresIn: this.accessTtl as never });
  }

  async signRefresh(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, { secret: this.secret, expiresIn: this.refreshTtl as never });
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
