import { useEffect, useRef } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";

interface VditorPreviewProps {
  content: string;
}

export function VditorPreview({ content }: VditorPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    Vditor.preview(containerRef.current, content, {
      mode: "light",
      cdn: "/vditor",
    });
  }, [content]);

  return <div ref={containerRef} className="vditor-preview vditor-reset" />;
}
