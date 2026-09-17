import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Toast, NavBar } from "@arco-design/mobile-react";
import { VditorPreview } from "../components/VditorPreview";
import { get } from "../api/client";

export function MdDocPreviewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      get<{ content: string }>(`/md-docs/${id}`)
        .then((doc) => setContent(doc.content))
        .catch(() => {
          Toast.info({ content: "加载失败" });
          navigate("/md-docs");
        })
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-100">
        <span className="text-sm text-gray-400">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-white">
      <NavBar title="文档预览" />
      <div className="flex-1 overflow-auto px-4 py-3">
        <VditorPreview content={content} />
      </div>
    </div>
  );
}
