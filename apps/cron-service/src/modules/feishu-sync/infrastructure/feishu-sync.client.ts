import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import type { FeishuSyncPort, FeishuDepartment, FeishuUser } from "../domain/feishu-sync.ports";

const FEISHU_TOKEN_URL = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";
const FEISHU_DEPARTMENT_URL = "https://open.feishu.cn/open-apis/contact/v3/departments";
const FEISHU_USER_URL = "https://open.feishu.cn/open-apis/contact/v3/users";
const FEISHU_API_TIMEOUT_MS = 10_000;
const PAGE_SIZE = 50;
const ROOT_DEPARTMENT_ID = "0";
const TOKEN_REFRESH_BUFFER_MS = 7_000_000;

interface FeishuDeptRaw {
  department_id: string;
  open_department_id: string;
  name: string;
  i18n_name?: Record<string, string>;
  parent_department_id?: string;
  order?: string;
  leader_user_id?: string;
  leaders?: Array<{ leaderID: string; leaderType: number }>;
  member_count?: number;
  primary_member_count?: number;
  status?: { is_deleted?: boolean };
}

interface FeishuUserRaw {
  open_id: string;
  union_id: string;
  name: string;
  nickname?: string;
  en_name?: string;
  description?: string;
  email?: string;
  avatar?: { avatar_72?: string; avatar_240?: string; avatar_640?: string; avatar_origin?: string };
  mobile_visible?: boolean;
  department_ids?: string[];
}

@Injectable()
export class FeishuSyncClient implements FeishuSyncPort {
  private readonly logger = new Logger(FeishuSyncClient.name);
  private readonly appId: string;
  private readonly appSecret: string;
  private tenantAccessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: ConfigService) {
    this.appId = this.config.get<string>("FEISHU_BUSINESS_APP_ID") ?? "";
    this.appSecret = this.config.get<string>("FEISHU_BUSINESS_APP_SECRET") ?? "";
    this.logger.log(`FeishuSyncClient initialized: appId=${this.appId}, appSecret=${this.appSecret ? "***" : "empty"}`);
  }

  async getTenantAccessToken(): Promise<string> {
    if (this.tenantAccessToken && Date.now() < this.tokenExpiresAt) {
      return this.tenantAccessToken;
    }

    this.logger.log(`Requesting tenant_access_token with app_id: ${this.appId}`);
    try {
      const res = await axios.post(
        FEISHU_TOKEN_URL,
        { app_id: this.appId, app_secret: this.appSecret },
        { headers: { "Content-Type": "application/json" }, timeout: FEISHU_API_TIMEOUT_MS }
      );
      const body = res.data as { tenant_access_token?: string; code: number; msg: string };
      this.logger.log(`Feishu token response: code=${body.code}, msg=${body.msg}`);
      if (body.code !== 0 || !body.tenant_access_token) {
        throw new Error(`Failed to get tenant_access_token: ${body.msg}`);
      }
      this.tenantAccessToken = body.tenant_access_token;
      this.tokenExpiresAt = Date.now() + TOKEN_REFRESH_BUFFER_MS;
      return this.tenantAccessToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Feishu token request failed: ${error.response?.status} ${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  async getDepartmentTree(): Promise<FeishuDepartment[]> {
    const token = await this.getTenantAccessToken();
    const departments: FeishuDepartment[] = [];
    let pageToken: string | undefined;

    this.logger.log("Fetching department tree...");
    try {
      do {
        const res = await axios.get(FEISHU_DEPARTMENT_URL, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page_size: PAGE_SIZE, parent_department_id: ROOT_DEPARTMENT_ID, page_token: pageToken },
          timeout: FEISHU_API_TIMEOUT_MS,
        });
        const body = res.data as {
          code: number;
          msg: string;
          data?: { items?: FeishuDeptRaw[]; page_token?: string; has_more?: boolean };
        };
        this.logger.log(
          `Department response: code=${body.code}, msg=${body.msg}, items=${body.data?.items?.length ?? 0}`
        );
        if (body.code !== 0) {
          throw new Error(`Failed to fetch departments: ${body.msg}`);
        }
        for (const item of body.data?.items ?? []) {
          departments.push({
            feishuId: item.department_id,
            openDepartmentId: item.open_department_id,
            name: item.name,
            i18nName: item.i18n_name,
            parentId: item.parent_department_id === ROOT_DEPARTMENT_ID ? null : (item.parent_department_id ?? null),
            order: Number(item.order ?? 0),
            leaderUserId: item.leader_user_id,
            leaders: item.leaders,
            memberCount: item.member_count,
            primaryMemberCount: item.primary_member_count,
            isDeleted: item.status?.is_deleted,
          });
        }
        pageToken = body.data?.has_more ? body.data.page_token : undefined;
      } while (pageToken);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Department API failed: ${error.response?.status} ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }

    this.logger.log(`Fetched ${departments.length} departments from Feishu`);
    return departments;
  }

  async getAllUsers(departmentIds: string[]): Promise<FeishuUser[]> {
    const token = await this.getTenantAccessToken();
    const userMap = new Map<string, FeishuUser>();

    for (const deptId of departmentIds) {
      let pageToken: string | undefined;
      do {
        const res = await axios.get(FEISHU_USER_URL, {
          headers: { Authorization: `Bearer ${token}` },
          params: { department_id: deptId, page_size: PAGE_SIZE, page_token: pageToken, user_id_type: "open_id" },
          timeout: FEISHU_API_TIMEOUT_MS,
        });
        const body = res.data as {
          code: number;
          msg: string;
          data?: { items?: FeishuUserRaw[]; page_token?: string; has_more?: boolean };
        };
        if (body.code !== 0) {
          this.logger.error(`User API failed for dept ${deptId}: ${body.msg}`);
          break;
        }
        for (const item of body.data?.items ?? []) {
          if (!userMap.has(item.open_id)) {
            userMap.set(item.open_id, {
              unionId: item.union_id,
              openId: item.open_id,
              name: item.name,
              nickname: item.nickname,
              enName: item.en_name,
              description: item.description,
              email: item.email ?? null,
              avatar72: item.avatar?.avatar_72 ?? null,
              avatar240: item.avatar?.avatar_240 ?? null,
              avatar640: item.avatar?.avatar_640 ?? null,
              avatarOrigin: item.avatar?.avatar_origin ?? null,
              mobileVisible: item.mobile_visible,
              departmentIds: item.department_ids,
              departmentId: item.department_ids?.[0] ?? null,
            });
          }
        }
        pageToken = body.data?.has_more ? body.data.page_token : undefined;
      } while (pageToken);
    }

    const users = Array.from(userMap.values());
    this.logger.log(`Fetched ${users.length} users from Feishu`);
    return users;
  }
}
