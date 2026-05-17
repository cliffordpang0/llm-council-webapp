import React from "react";
import type { CouncilMode } from "../api/council";

const MODES = [
  { id: "parallel" as CouncilMode, label: "Parallel + Vote", description: "All personas answer simultaneously", icon: "⚡" },
  { id: "sequential" as CouncilMode, label: "Sequential Chain", description: "Each persona refines the last", icon: "🔗" },
  { id: "debate" as CouncilMode, label: "Debate + Synthesis", description: "Personas debate, then synthesize", icon: "⚖️" },
  { id: "router" as CouncilMode, label: "Mixture of Agents", description: "Router picks the best experts", icon: "🧭" },
];

interface Props { selected: CouncilMode; onChange: (mode: CouncilMode) => void; disabled?: boolean; }

export default function ModeSelector({ selected, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MODES.map((m) => (
        <button key={m.id} onClick={() => onChange(m.id)} disabled={disabled}
          className={`rounded-xl border p-3 text-left transition-all ${selected === m.id ? "border-indigo-500 bg-indigo-900/40 text-white" : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500 hover:text-gray-200"} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
          <div className="text-xl">{m.icon}</div>
          <div className="mt-1 text-sm font-semibold">{m.label}</div>
          <div className="mt-0.5 text-xs opacity-70">{m.description}</div>
        </button>
      ))}
    </div>
  );
}
