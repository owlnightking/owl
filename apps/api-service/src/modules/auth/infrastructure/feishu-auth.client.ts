import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import type { AuthPort, FeishuUserInfo } from "../domain/auth.ports";

const FEISHU_AUTHORIZE_URL = "https://open.feishu.cn/open-apis/authen/v1/authorize";
const FEISHU_TOKEN_URL = "https://open.feishu.cn/open-apis/authen/v2/oauth/token";
const FEISHU_USERINFO_URL = "https://open.feishu.cn/open-apis/authen/v1/user_info";
const FEISHU_SCOPE = "contact:user.base:readonly";

@Injectable()
export class FeishuAuthClient implements AuthPort {
  private readonly logger = new Logger(FeishuAuthClient.name);
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  constructor(config: ConfigService) {
    this.appId = config.get<string>("FEISHU_APP_ID") ?? "";
    this.appSecret = config.get<string>("FEISHU_APP_SECRET") ?? "";
    this.redirectUri = config.get<string>("FEISHU_REDIRECT_URI") ?? "";
    if (!this.appId || !this.appSecret || !this.redirectUri) {
      this.logger.error("FEISHU_APP_ID / FEISHU_APP_SECRET / FEISHU_REDIRECT_URI 未配置");
    }
  }

  buildAuthorizeUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      app_id: this.appId,
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      scope: FEISHU_SCOPE,
    });
    return `${FEISHU_AUTHORIZE_URL}?${params.toString()}`;
  }

  async exchangeCodeForUser(code: string, redirectUri: string): Promise<FeishuUserInfo> {
    const tokenRes = await axios.post(
      FEISHU_TOKEN_URL,
      {
        grant_type: "authorization_code",
        code,
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: redirectUri,
      },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );
    const body = tokenRes.data;
    const accessToken = body?.access_token;
    if (!accessToken) {
      this.logger.error(`feishu token 换取失败: ${JSON.stringify(body)}`);
      throw new Error("feishu oauth token exchange failed");
    }
    const infoRes = await axios.get(FEISHU_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
    const info = infoRes.data?.data;
    if (!info?.union_id || !info?.name) {
      this.logger.error(`feishu userinfo 获取失败: ${JSON.stringify(infoRes.data)}`);
      throw new Error("feishu user info fetch failed");
    }
    return {
      unionId: info.union_id,
      openId: info.open_id ?? info.union_id,
      name: info.name,
      avatarUrl: info.avatar_url ?? undefined,
      email: info.email ?? undefined,
    };
  }
}
