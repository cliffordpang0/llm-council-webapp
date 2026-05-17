import React, { useRef } from "react";

interface Props {
  value: string; onChange: (v: string) => void; onSubmit: () => void;
  loading: boolean; onStop: () => void; models: string[];
  selectedModel: string; onModelChange: (m: string) => void;
}

export default function ChatInput({ value, onChange, onSubmit, loading, onStop, models, selectedModel, onModelChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!loading && value.trim()) onSubmit(); }
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">Model:</label>
        <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)} disabled={loading}
          className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKey}
          disabled={loading} rows={2} placeholder="Ask the council anything… (Enter to send, Shift+Enter for newline)"
          className="flex-1 resize-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50" />
        {loading
          ? <button onClick={onStop} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Stop</button>
          : <button onClick={onSubmit} disabled={!value.trim()} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">Ask</button>
        }
      </div>
    </div>
  );
}
