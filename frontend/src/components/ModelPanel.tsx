import React from "react";
import Markdown from "react-markdown";

export interface PanelState { name: string; color: string; content: string; done: boolean; streaming: boolean; }

const DEFAULT_COLORS: Record<string, string> = {
  Analyst: "#3b82f6", Skeptic: "#ef4444", Optimist: "#22c55e",
  Pragmatist: "#f59e0b", Synthesis: "#a855f7", Aggregator: "#a855f7", Router: "#64748b",
};

const PERSONA_SUBTITLES: Record<string, string> = {
  Analyst: "logical · evidence-first", Skeptic: "critical · risk-aware",
  Optimist: "opportunity-focused", Pragmatist: "action-oriented",
  Synthesis: "balanced final answer", Aggregator: "unified summary",
};

export default function ModelPanel({ panel, isSynthesis = false }: { panel: PanelState; isSynthesis?: boolean }) {
  const color = panel.color || DEFAULT_COLORS[panel.name] || "#6b7280";
  return (
    <div className={`flex flex-col rounded-2xl border bg-gray-900 ${isSynthesis ? "col-span-full" : ""}`} style={{ borderColor: color + "55" }}>
      <div className="flex items-center gap-2 rounded-t-2xl px-4 py-2" style={{ backgroundColor: color + "22" }}>
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold leading-tight" style={{ color }}>{panel.name}</span>
          {PERSONA_SUBTITLES[panel.name] && <span className="text-xs text-gray-500 leading-tight">{PERSONA_SUBTITLES[panel.name]}</span>}
        </div>
        {panel.streaming && !panel.done && <span className="ml-auto text-xs text-gray-500 animate-pulse flex-shrink-0">thinking…</span>}
        {panel.done && <span className="ml-auto text-xs text-gray-600 flex-shrink-0">done</span>}
      </div>
      <div className="flex-1 overflow-auto px-4 py-3">
        {panel.content
          ? <div className={`prose prose-sm prose-invert max-w-none text-gray-200 ${panel.streaming && !panel.done ? "streaming-cursor" : ""}`}><Markdown>{panel.content}</Markdown></div>
          : <p className="text-sm text-gray-600 italic">{panel.streaming ? "Waiting for response…" : "No response yet"}</p>
        }
      </div>
    </div>
  );
}
