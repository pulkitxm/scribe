"use client";

import Editor from "@monaco-editor/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JsonViewerModalProps {
  data: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JsonViewerModal({
  data,
  isOpen,
  onOpenChange,
}: JsonViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-6">
        <DialogHeader className="mb-4">
          <DialogTitle>Raw JSON Data</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 border rounded-md overflow-hidden bg-[#1e1e1e]">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={JSON.stringify(data, null, 2)}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: 13,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
