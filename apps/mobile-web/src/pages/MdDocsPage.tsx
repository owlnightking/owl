import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Toast, NavBar } from "@arco-design/mobile-react";
import { get, del } from "../api/client";

interface MdDoc {
  id: string;
  authorId: string;
  content: string;
  excerpt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function MdDocsPage() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<MdDoc[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ items: MdDoc[]; total: number }>("/md-docs", { page: 1, pageSize: 50 });
      setDocs(res.items);
    } catch {
      Toast.info({ content: "加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleDelete = async (id: string) => {
    try {
      await del(`/md-docs/${id}`);
      Toast.success({ content: "删除成功" });
      fetchDocs();
    } catch {
      Toast.info({ content: "删除失败" });
    }
  };

  return (
    <div className="min-h-dvh bg-gray-100">
      <NavBar title="文档" />
      <div className="px-4 pt-4 pb-20">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">加载中...</div>
        ) : docs.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">暂无文档</div>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="mb-3 rounded-xl bg-white p-4 shadow-sm">
              <button className="w-full text-left" onClick={() => navigate(`/md-docs/${doc.id}/preview`)}>
                <p className="line-clamp-3 text-sm text-gray-700">{doc.excerpt || "空白文档"}</p>
                <p className="mt-2 text-xs text-gray-400">{doc.updatedAt?.slice(0, 10)}</p>
              </button>
              <div className="mt-3 flex justify-end gap-3 border-t border-gray-50 pt-2">
                <button className="text-xs text-blue-500" onClick={() => navigate(`/md-docs/${doc.id}/edit`)}>
                  编辑
                </button>
                <button className="text-xs text-red-500" onClick={() => handleDelete(doc.id)}>
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <button
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg active:bg-blue-600"
        onClick={() => navigate("/md-docs/new")}
        aria-label="新建文档"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
