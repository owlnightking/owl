import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Space, Badge, Notification } from "@arco-design/web-react";
import { IconSave, IconLeft } from "@arco-design/web-react/icon";
import { VditorEditor } from "../components/VditorEditor";
import { get, post, put } from "../api/client";
import { saveDraft, getDraft, deleteDraft } from "../utils/md-doc-draft";

const STABLE_DELAY_MS = 800;

interface DocResponse {
  content: string;
}

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
      get<DocResponse>(`/md-docs/${id}`)
        .then((doc) => {
          docIdRef.current = id;
          serverIdRef.current = id;
          contentRef.current = doc.content;
          baselineRef.current = doc.content;
          serverBaselineRef.current = doc.content;
          setContent(doc.content);
          setDirtyState(false);
        })
        .catch(() => Notification.error({ content: "加载失败" }))
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
        if (ok) Notification.success({ content: "已保存" });
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
      Notification.success({ content: "数据已永久保存" });
      if (isNew && serverIdRef.current) {
        navigate(`/md-docs/${serverIdRef.current}/edit`, { replace: true });
      }
    } else {
      Notification.error({ content: "保存失败，请检查网络" });
    }
  };

  const handleBack = async () => {
    if (contentRef.current.trimEnd() !== serverBaselineRef.current.trimEnd()) {
      const ok = await flushToServer();
      if (!ok) {
        await flushLocalDraft();
      }
      Notification.success({ content: "已保存" });
    }
    navigate("/md-docs");
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-400">加载中...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
        <Space>
          <Button icon={<IconLeft />} onClick={handleBack}>
            返回
          </Button>
          <span className="text-sm text-gray-500">{isNew ? "新建文档" : "编辑文档"}</span>
        </Space>
        <Space>
          <Badge status={dirty ? "error" : "success"} text={dirty ? "未保存" : "已保存"} />
          <Button type="primary" icon={<IconSave />} loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
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
