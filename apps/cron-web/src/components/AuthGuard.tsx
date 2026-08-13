import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "@arco-design/web-react";
import { useAuthStore } from "../store/auth";

interface Props {
  children: ReactNode;
}

export function AuthGuard({ children }: Props) {
  const checked = useAuthStore((s) => s.checked);
  const loading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    if (!checked) {
      void fetchMe();
    }
  }, [checked, fetchMe]);

  if (!checked || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spin size={40} tip="正在验证会话…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/api/auth/feishu/login?redirect=${encodeURIComponent(window.location.pathname)}`} replace />;
  }

  return <>{children}</>;
}
