import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@arco-design/web-react";
import { IconLeft, IconEdit } from "@arco-design/web-react/icon";
import { VditorPreview } from "../components/VditorPreview";
import { get } from "../api/client";

interface DocResponse {
  content: string;
}

export function MdDocPreviewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      get<DocResponse>(`/md-docs/${id}`)
        .then((doc) => setContent(doc.content))
        .catch(() => navigate("/md-docs"))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-400">加载中...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
        <Button icon={<IconLeft />} onClick={() => navigate("/md-docs")}>
          返回列表
        </Button>
        <Button icon={<IconEdit />} onClick={() => navigate(`/md-docs/${id}/edit`)}>
          编辑
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <VditorPreview content={content} />
      </div>
    </div>
  );
}
