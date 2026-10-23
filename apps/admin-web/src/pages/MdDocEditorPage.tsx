import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Space, Badge, Notification, Skeleton, Modal, Select } from "@arco-design/web-react";
import { IconSave, IconLeft } from "@arco-design/web-react/icon";
import { VditorEditor } from "../components/VditorEditor";
import { get, post, put } from "../api/client";
import { PersonName } from "../components/PersonName";
import { saveDraft, getDraft, deleteDraft } from "../utils/md-doc-draft";

const STABLE_DELAY_MS = 800;
const COLLABORATOR_SEARCH_DELAY_MS = 300;

interface DocResponse {
  content: string;
  canManageCollaborators: boolean;
}

interface CollaboratorOption {
  id: number;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

interface DocCollaborator {
  userId: number;
  name: string;
  avatarUrl: string | null;
}

export function MdDocEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [canManageCollaborators, setCanManageCollaborators] = useState(false);
  const [collaboratorVisible, setCollaboratorVisible] = useState(false);
  const [collaboratorSaving, setCollaboratorSaving] = useState(false);
  const [collaboratorIds, setCollaboratorIds] = useState<number[]>([]);
  const [collaboratorOptions, setCollaboratorOptions] = useState<CollaboratorOption[]>([]);
  const collaboratorSearchTimer = useRef<number | null>(null);
  const collaboratorLabelCache = useRef(new Map<number, CollaboratorOption>());
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
          setCanManageCollaborators(doc.canManageCollaborators);
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

  useEffect(() => {
    return () => {
      if (collaboratorSearchTimer.current !== null) {
        window.clearTimeout(collaboratorSearchTimer.current);
      }
    };
  }, []);

  const mergeCachedOptions = useCallback((options: CollaboratorOption[]) => {
    const merged = [...options];
    for (const cached of collaboratorLabelCache.current.values()) {
      if (!merged.some((option) => option.id === cached.id)) merged.push(cached);
    }
    return merged;
  }, []);

  const loadCollaboratorOptions = useCallback(
    async (keyword?: string) => {
      const options = await get<CollaboratorOption[]>("/md-docs/collaborator-candidates", {
        q: keyword || undefined,
      });
      setCollaboratorOptions(mergeCachedOptions(options));
    },
    [mergeCachedOptions]
  );

  const openCollaboratorModal = async () => {
    if (isNew || !id) return;
    try {
      const [current] = await Promise.all([
        get<DocCollaborator[]>(`/md-docs/${id}/collaborators`),
        loadCollaboratorOptions(),
      ]);
      for (const item of current) {
        collaboratorLabelCache.current.set(item.userId, {
          id: item.userId,
          name: item.name,
          email: null,
          avatarUrl: item.avatarUrl,
        });
      }
      setCollaboratorIds(current.map((item) => item.userId));
      setCollaboratorOptions((prev) => mergeCachedOptions(prev));
      setCollaboratorVisible(true);
    } catch (error) {
      Notification.error({ content: error instanceof Error ? error.message : "加载文档编辑权限失败" });
    }
  };

  const handleCollaboratorChange = (value: (string | number)[]) => {
    const ids = value.map(Number);
    setCollaboratorIds(ids);
    for (const option of collaboratorOptions) {
      if (ids.includes(option.id)) collaboratorLabelCache.current.set(option.id, option);
    }
  };

  const handleCollaboratorSearch = (keyword: string) => {
    if (collaboratorSearchTimer.current !== null) {
      window.clearTimeout(collaboratorSearchTimer.current);
    }
    collaboratorSearchTimer.current = window.setTimeout(() => {
      loadCollaboratorOptions(keyword).catch(() => Notification.error({ content: "搜索用户失败" }));
    }, COLLABORATOR_SEARCH_DELAY_MS);
  };

  const saveCollaborators = async () => {
    if (!id) return;
    setCollaboratorSaving(true);
    try {
      await put(`/md-docs/${id}/collaborators`, { userIds: collaboratorIds });
      Notification.success({ content: "文档编辑权限已更新" });
      setCollaboratorVisible(false);
    } catch (error) {
      Notification.error({ content: error instanceof Error ? error.message : "保存文档编辑权限失败" });
    } finally {
      setCollaboratorSaving(false);
    }
  };

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
    return (
      <div className="flex h-64 flex-col gap-4">
        <Skeleton text={{ rows: 3 }} />
        <Skeleton text={{ rows: 6 }} />
      </div>
    );
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
          {canManageCollaborators && <Button onClick={openCollaboratorModal}>文档编辑权限</Button>}
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
      <Modal
        title="设置文档编辑权限"
        visible={collaboratorVisible}
        confirmLoading={collaboratorSaving}
        onOk={saveCollaborators}
        onCancel={() => setCollaboratorVisible(false)}
        unmountOnExit
      >
        <Select
          mode="multiple"
          placeholder="搜索并选择人员"
          value={collaboratorIds}
          options={collaboratorOptions.map((user) => ({
            label: <PersonName name={user.name} avatarUrl={user.avatarUrl} />,
            value: user.id,
          }))}
          renderFormat={(_option, value) => {
            const user = collaboratorOptions.find((item) => item.id === Number(value));
            return user ? <PersonName name={user.name} avatarUrl={user.avatarUrl} size={18} /> : String(value);
          }}
          filterOption={false}
          onSearch={handleCollaboratorSearch}
          onChange={handleCollaboratorChange}
        />
      </Modal>
    </div>
  );
}
