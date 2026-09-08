import { useEffect, useState } from "react";
import { Button, Card, Message, Select, Spin } from "@arco-design/web-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { get, post } from "../api/client";
import { useAuthStore } from "../store/auth";

interface MockUser {
  id: string;
  unionId: string;
  name: string;
  avatarUrl: string | null;
  status: string;
}

export function MockLoginPage() {
  const [users, setUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUnionId, setSelectedUnionId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const redirect = searchParams.get("redirect") || "/home";

  useEffect(() => {
    get<MockUser[]>("/auth/mock-users")
      .then(setUsers)
      .catch(() => Message.error("加载用户列表失败"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async () => {
    if (!selectedUnionId) return;
    setSubmitting(true);
    try {
      await post("/auth/mock-login", { unionId: selectedUnionId, clientName: "owl-web" });
      await fetchMe();
      navigate(redirect, { replace: true });
    } catch {
      Message.error("登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spin size={40} tip="加载用户列表…" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Card className="w-96" title="本地开发登录">
        <div className="mb-4 text-sm text-gray-500">选择一个用户模拟登录（仅限开发环境）</div>
        <Select
          placeholder="请选择用户"
          style={{ width: "100%", marginBottom: 16 }}
          value={selectedUnionId}
          onChange={setSelectedUnionId}
          allowClear
        >
          {users.map((u) => (
            <Select.Option key={u.unionId} value={u.unionId}>
              {u.name}（{u.unionId}）
            </Select.Option>
          ))}
        </Select>
        <Button type="primary" long disabled={!selectedUnionId} loading={submitting} onClick={handleLogin}>
          登录
        </Button>
      </Card>
    </div>
  );
}
