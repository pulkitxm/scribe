"use client";

import { useEffect, useState, Suspense } from "react";
import Editor from "@monaco-editor/react";
import { Download, FileText, Activity } from "lucide-react";
import { useAtom } from "jotai";
import { logTypeAtom } from "@/lib/store";

function LogsContent() {
  const [logs, setLogs] = useState<string>("");
  const [type, setType] = useAtom(logTypeAtom);

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scribe-${type}-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/logs?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        const content = data.content || "";
        setLogs(content.replace(/\u001b\[[0-9;]*m/g, ""));
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, [type]);

  return (
    <div className="fixed left-0 right-0 bottom-0 top-14 bg-[#1e1e1e]">
      <Editor
        height="100%"
        width="100%"
        theme="vs-dark"
        defaultLanguage="ini"
        value={logs}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          fontSize: 14,
          fontFamily: "monospace",
          renderLineHighlight: "none",
          padding: { top: 10, bottom: 10 },
          domReadOnly: true,
        }}
        onMount={(editor) => {
          editor.focus();
        }}
        loading={<div className="text-white p-4">Loading editor...</div>}
      />
      <div className="absolute bottom-2 right-4 flex flex-col-reverse items-end gap-3 z-10">
        <div className="text-xs text-neutral-500 bg-[#1e1e1e]/80 px-2 py-1 rounded backdrop-blur-sm">
          Auto-refreshing every 1s
        </div>

        <div className="flex bg-[#2d2d2d] rounded-lg p-1 shadow-lg border border-neutral-700 flex gap-2 p-2">
          <button
            onClick={() => setType("app")}
            className={`cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              type === "app"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-700"
            }`}
          >
            <FileText size={14} />
            App Logs
          </button>
          <button
            onClick={() => setType("analyze")}
            className={`cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              type === "analyze"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-700"
            }`}
          >
            <Activity size={14} />
            Analyze Logs
          </button>
        </div>

        <button
          onClick={downloadLogs}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2.5 shadow-lg cursor-pointer transition-colors"
          title="Download logs"
        >
          <Download size={18} />
        </button>
      </div>
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-white">Loading...</div>}>
      <LogsContent />
    </Suspense>
  );
}
