import { useEffect, type ReactNode } from "react";
import { Loading } from "@arco-design/mobile-react";
import { useAuthStore } from "../store/auth";

interface Props {
  children: ReactNode;
}

function loginRedirect() {
  const redirect = encodeURIComponent(window.location.pathname);
  window.location.href = `/api/auth/feishu/login?redirect=${redirect}`;
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
        <Loading type="spin" radius={14} stroke={3} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
