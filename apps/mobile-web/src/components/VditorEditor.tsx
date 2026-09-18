import { useCallback, useEffect, useRef, useState } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";

interface VditorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  height?: string;
}

const SUPPRESS_TIMEOUT_MS = 800;

export function VditorEditor({
  value,
  onChange,
  onBlur,
  readOnly = false,
  placeholder,
  height = "100%",
}: VditorEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const vditorRef = useRef<Vditor | null>(null);
  const readyRef = useRef(false);
  const lastEmittedRef = useRef("");
  const suppressInputRef = useRef(false);
  const suppressTimerRef = useRef<number | null>(null);
  const valueRef = useRef(value);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const toolbarExpandedRef = useRef(false);
  const [editorReady, setEditorReady] = useState(false);

  const clearSuppressTimer = useCallback(() => {
    if (suppressTimerRef.current !== null) {
      window.clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = null;
    }
  }, []);

  /**
   * 折叠时隐藏第一行以外的工具按钮。用隐藏而非 overflow 裁剪，
   * 否则标题/表情等下拉面板会被工具栏裁掉。
   */
  const applyToolbarCollapse = useCallback((collapsed: boolean) => {
    const toolbar = hostRef.current?.querySelector<HTMLElement>(".vditor-toolbar");
    const items = toolbar ? (Array.from(toolbar.children) as HTMLElement[]) : [];
    if (items.length === 0) return;
    items.forEach((item) => {
      item.style.display = "";
    });
    if (!collapsed) return;
    const firstRowTop = Math.min(...items.map((item) => Math.round(item.getBoundingClientRect().top)));
    items.forEach((item) => {
      if (Math.round(item.getBoundingClientRect().top) > firstRowTop) {
        item.style.display = "none";
      }
    });
  }, []);

  const handleToggleToolbar = useCallback(() => {
    setToolbarExpanded((prev) => {
      const next = !prev;
      toolbarExpandedRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!editorReady) return;
    applyToolbarCollapse(!toolbarExpanded);
  }, [editorReady, toolbarExpanded, applyToolbarCollapse]);

  const armSuppressTimer = useCallback(() => {
    clearSuppressTimer();
    suppressInputRef.current = true;
    suppressTimerRef.current = window.setTimeout(() => {
      suppressInputRef.current = false;
      suppressTimerRef.current = null;
    }, SUPPRESS_TIMEOUT_MS);
  }, [clearSuppressTimer]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    readyRef.current = false;
    setEditorReady(false);
    const editorEl = document.createElement("div");
    editorEl.style.height = "100%";
    host.appendChild(editorEl);

    const setValueProgrammatic = (next: string) => {
      const vditor = vditorRef.current;
      if (!vditor || !readyRef.current) return;
      armSuppressTimer();
      try {
        vditor.setValue(next);
      } catch {
        suppressInputRef.current = false;
      }
    };

    const applyLatestValue = () => {
      const vditor = vditorRef.current;
      if (!vditor || !readyRef.current) return;
      try {
        const current = vditor.getValue();
        if (current !== valueRef.current && current !== lastEmittedRef.current) {
          setValueProgrammatic(valueRef.current);
        }
      } catch {
        // value already applied at init
      }
    };

    const vditor = new Vditor(editorEl, {
      mode: "ir",
      value: valueRef.current,
      placeholder,
      height,
      icon: "ant",
      cdn: `${import.meta.env.BASE_URL}vditor`,
      cache: { enable: false },
      undoDelay: 300,
      outline: { enable: false, position: "left" },
      toolbar: readOnly ? [] : undefined,
      after: () => {
        readyRef.current = true;
        applyLatestValue();
        setEditorReady(true);
      },
      input: readOnly
        ? undefined
        : (val) => {
            if (!readyRef.current) return;
            if (suppressInputRef.current) {
              suppressInputRef.current = false;
              clearSuppressTimer();
              return;
            }
            lastEmittedRef.current = val;
            onChange?.(val);
          },
      blur: readOnly
        ? undefined
        : (val) => {
            if (!readyRef.current) return;
            onBlur?.(val);
          },
      upload: readOnly
        ? undefined
        : {
            url: "/api/md-docs/upload-image",
            fieldName: "file",
            format: (_files: File[], responseText: string) => {
              const res = JSON.parse(responseText);
              const url = res.data?.url ?? "";
              return JSON.stringify({ msg: "", code: 0, data: { url, errFiles: [] } });
            },
          },
    });
    vditorRef.current = vditor;

    return () => {
      readyRef.current = false;
      vditorRef.current = null;
      clearSuppressTimer();
      try {
        vditor.destroy();
      } catch {
        // vditor not fully initialized (StrictMode double-mount)
      }
      host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  useEffect(() => {
    const vditor = vditorRef.current;
    if (!vditor || !readyRef.current) return;
    try {
      const current = vditor.getValue();
      if (current !== value && current !== lastEmittedRef.current) {
        armSuppressTimer();
        vditor.setValue(value);
      }
    } catch {
      // ignore
    }
  }, [value, armSuppressTimer]);

  useEffect(() => {
    const handleResize = () => applyToolbarCollapse(!toolbarExpandedRef.current);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [applyToolbarCollapse]);

  return (
    <div className="vditor-editor-wrap">
      {!readOnly && (
        <button
          type="button"
          className="absolute right-0 top-0 z-10 flex h-9 w-[38px] items-center justify-center border-l border-gray-200 bg-white text-gray-500"
          aria-label={toolbarExpanded ? "收起工具栏" : "展开工具栏"}
          onClick={handleToggleToolbar}
        >
          <svg
            className={`h-4 w-4 transition-transform ${toolbarExpanded ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
      <div ref={hostRef} className="vditor-editor" style={{ height: "100%" }} />
    </div>
  );
}
