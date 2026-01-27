'use client';

import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Download } from 'lucide-react';

export default function LogsPage() {
    const [logs, setLogs] = useState<string>('');

    const downloadLogs = () => {
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scribe-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/logs');
            if (res.ok) {
                const data = await res.json();
                const content = data.content || '';
                setLogs(content.replace(/\u001b\[[0-9;]*m/g, ''));
            }
        } catch (err) {
            console.error('Failed to fetch logs', err);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 1000);
        return () => clearInterval(interval);
    }, []);

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
                    wordWrap: 'on',
                    fontSize: 14,
                    fontFamily: 'monospace',
                    renderLineHighlight: 'none',
                    padding: { top: 10, bottom: 10 },
                    domReadOnly: true,
                }}
                onMount={(editor) => {
                    editor.focus();
                }}
                loading={<div className="text-white p-4">Loading editor...</div>}
            />
            <div className="absolute bottom-2 right-4 text-xs text-neutral-500 z-10 bg-[#1e1e1e] px-2 py-1 rounded">
                Auto-refreshing every 1s
            </div>
            <button
                onClick={downloadLogs}
                className="absolute bottom-10 right-4 z-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg cursor-pointer"
                title="Download logs"
            >
                <Download size={20} />
            </button>
        </div>
    );
}
