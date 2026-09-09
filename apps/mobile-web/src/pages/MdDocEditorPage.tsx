import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Notify } from "@arco-design/mobile-react";
import { createRoot } from "react-dom/client";
import { VditorEditor } from "../components/VditorEditor";
import { get, post, put } from "../api/client";
import { saveDraft, getDraft, deleteDraft } from "../utils/md-doc-draft";

const STABLE_DELAY_MS = 800;
const NOTIFY_CONTEXT = { createRoot };

export function MdDocEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const docIdRef = useRef(id && id !== "new" ? id : "");
  const serverIdRef = useRef(id && id !== "new" ? id : "");
  const contentRef = useRef("");
  const baselineRef = useRef("");
  const serverBaselineRef = useRef("");
  const pendingBaselineRef = useRef<string | null>(null);
  const dirtyRef = useRef(false);
  const stableRef = useRef(false);

  const setDirtyState = useCallback((next: boolean) => {
    dirtyRef.current = next;
    setDirty(next);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      stableRef.current = true;
    }, STABLE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      get<{ content: string }>(`/md-docs/${id}`)
        .then((doc) => {
          docIdRef.current = id;
          serverIdRef.current = id;
          contentRef.current = doc.content;
          baselineRef.current = doc.content;
          serverBaselineRef.current = doc.content;
          setContent(doc.content);
          setDirtyState(false);
        })
        .catch(() => Notify.error({ content: "加载失败" }, NOTIFY_CONTEXT))
        .finally(() => setLoading(false));
    }
  }, [id, isNew, setDirtyState]);

  useEffect(() => {
    if (isNew) {
      getDraft(docIdRef.current || "").then((draft) => {
        if (draft && !contentRef.current) {
          contentRef.current = draft;
          pendingBaselineRef.current = draft;
          setContent(draft);
          setDirtyState(false);
        }
      });
    }
  }, [isNew, setDirtyState]);

  const handleContentChange = useCallback(
    (val: string) => {
      contentRef.current = val;
      if (pendingBaselineRef.current !== null) {
        if (val.trimEnd() === pendingBaselineRef.current.trimEnd()) {
          baselineRef.current = val;
          pendingBaselineRef.current = null;
          return;
        }
        pendingBaselineRef.current = null;
      }
      if (val.trimEnd() === baselineRef.current.trimEnd()) {
        return;
      }
      setContent(val);
      setDirtyState(true);
    },
    [setDirtyState]
  );

  const flushLocalDraft = useCallback(async () => {
    const docId = docIdRef.current || crypto.randomUUID();
    if (!docIdRef.current) docIdRef.current = docId;
    await saveDraft(docId, contentRef.current);
    baselineRef.current = contentRef.current;
    pendingBaselineRef.current = null;
    setDirtyState(false);
  }, [setDirtyState]);

  const flushToServer = useCallback(async (): Promise<boolean> => {
    const text = contentRef.current;
    try {
      if (serverIdRef.current) {
        await put(`/md-docs/${serverIdRef.current}`, { content: text });
      } else {
        const res = await post<{ id: string }>("/md-docs", { content: text });
        serverIdRef.current = res.id;
        docIdRef.current = res.id;
      }
      await deleteDraft(docIdRef.current);
      baselineRef.current = text;
      serverBaselineRef.current = text;
      pendingBaselineRef.current = null;
      setDirtyState(false);
      return true;
    } catch {
      return false;
    }
  }, [setDirtyState]);

  useEffect(() => {
    return () => {
      if (!stableRef.current) return;
      if (contentRef.current.trimEnd() === serverBaselineRef.current.trimEnd()) return;
      void flushToServer().then((ok) => {
        if (ok) Notify.success({ content: "已保存" }, NOTIFY_CONTEXT);
      });
    };
  }, [flushToServer]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      void saveDraft(docIdRef.current || crypto.randomUUID(), contentRef.current);
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleEditorBlur = useCallback(
    (val: string) => {
      contentRef.current = val;
      if (val.trimEnd() === baselineRef.current.trimEnd()) return;
      void flushLocalDraft();
    },
    [flushLocalDraft]
  );

  const handleSave = async () => {
    setSaving(true);
    const ok = await flushToServer();
    setSaving(false);
    if (ok) {
      Notify.success({ content: "数据已永久保存" }, NOTIFY_CONTEXT);
      if (isNew && serverIdRef.current) {
        navigate(`/md-docs/${serverIdRef.current}/edit`, { replace: true });
      }
    } else {
      Notify.error({ content: "保存失败，请检查网络" }, NOTIFY_CONTEXT);
    }
  };

  const handleBack = async () => {
    if (contentRef.current.trimEnd() !== serverBaselineRef.current.trimEnd()) {
      const ok = await flushToServer();
      if (!ok) {
        await flushLocalDraft();
      }
      Notify.success({ content: "已保存" }, NOTIFY_CONTEXT);
    }
    navigate("/md-docs");
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-100">
        <span className="text-sm text-gray-400">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-white">
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button className="text-sm text-blue-500" onClick={handleBack}>
            返回
          </button>
          <span className="text-sm text-gray-500">{isNew ? "新建文档" : "编辑文档"}</span>
          <button
            className={`text-sm ${saving ? "text-gray-400" : "text-blue-500"}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
        <div className="flex items-center justify-center gap-1 pb-1.5 text-xs">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${dirty ? "bg-red-500" : "bg-green-500"}`} />
          <span className={dirty ? "text-red-500" : "text-green-500"}>{dirty ? "未保存" : "已保存"}</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <VditorEditor
          value={content}
          onChange={handleContentChange}
          onBlur={handleEditorBlur}
          placeholder="开始写作..."
        />
      </div>
    </div>
  );
}
