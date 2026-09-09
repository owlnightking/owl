import { useCallback, useEffect, useRef } from "react";
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

  const clearSuppressTimer = useCallback(() => {
    if (suppressTimerRef.current !== null) {
      window.clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = null;
    }
  }, []);

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
      cdn: "/vditor",
      cache: { enable: false },
      undoDelay: 300,
      outline: { enable: true, position: "left" },
      toolbar: readOnly ? [] : undefined,
      after: () => {
        readyRef.current = true;
        applyLatestValue();
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

  return <div ref={hostRef} className="vditor-editor" style={{ height: "100%" }} />;
}
