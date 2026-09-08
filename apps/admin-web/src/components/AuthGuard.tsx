import { useEffect, type ReactNode } from "react";
import { Spin } from "@arco-design/web-react";
import { useAuthStore } from "../store/auth";

interface Props {
  children: ReactNode;
}

const isDev = import.meta.env.DEV;

function loginRedirect() {
  const redirect = encodeURIComponent(window.location.pathname);
  if (isDev) {
    window.location.href = `/mock-login?redirect=${redirect}`;
  } else {
    window.location.href = `/api/auth/feishu/login?redirect=${redirect}`;
  }
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

  useEffect(() => {
    if (checked && !loading && !user) {
      loginRedirect();
    }
  }, [checked, loading, user]);

  if (!checked || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spin size={40} tip="正在验证会话…" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
