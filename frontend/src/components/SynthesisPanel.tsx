import React from "react";
import ModelPanel, { type PanelState } from "./ModelPanel";

export default function SynthesisPanel({ panel }: { panel: PanelState | null }) {
  if (!panel) return null;
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-px flex-1 bg-purple-900/60" />
        <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">Final Synthesis</span>
        <div className="h-px flex-1 bg-purple-900/60" />
      </div>
      <ModelPanel panel={panel} isSynthesis />
    </div>
  );
}
