import React, { useCallback, useEffect, useRef, useState } from "react";
import ModeSelector from "./components/ModeSelector";
import ChatInput from "./components/ChatInput";
import ModelPanel, { type PanelState } from "./components/ModelPanel";
import SynthesisPanel from "./components/SynthesisPanel";
import { fetchModels, streamCouncil, type CouncilMode, type SSEEvent } from "./api/council";

const SYNTHESIS_NAMES = new Set(["Synthesis", "Aggregator"]);

export default function App() {
  const [mode, setMode] = useState<CouncilMode>("parallel");
  const [question, setQuestion] = useState("");
  const [models, setModels] = useState<string[]>(["llama3.1:latest"]);
  const [selectedModel, setSelectedModel] = useState("llama3.1:latest");
  const [loading, setLoading] = useState(false);
  const [panels, setPanels] = useState<PanelState[]>([]);
  const [synthPanel, setSynthPanel] = useState<PanelState | null>(null);
  const [routerInfo, setRouterInfo] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchModels().then((ms) => { setModels(ms); if (ms.length > 0) setSelectedModel(ms[0]); }).catch(() => {});
  }, []);

  const handleEvent = useCallback((e: SSEEvent) => {
    if (e.event === "model_start") {
      if (!e.model) return;
      if (SYNTHESIS_NAMES.has(e.model)) {
        setSynthPanel({ name: e.model, color: e.color ?? "", content: "", done: false, streaming: true });
      } else if (e.model === "Router") {
        setRouterInfo("Router is selecting experts…");
      } else {
        setPanels((prev) => prev.find((p) => p.name === e.model) ? prev : [...prev, { name: e.model!, color: e.color ?? "", content: "", done: false, streaming: true }]);
      }
    } else if (e.event === "chunk") {
      if (!e.model || !e.content) return;
      if (SYNTHESIS_NAMES.has(e.model)) {
        setSynthPanel((prev) => prev ? { ...prev, content: prev.content + e.content } : null);
      } else {
        setPanels((prev) => prev.map((p) => p.name === e.model ? { ...p, content: p.content + e.content } : p));
      }
    } else if (e.event === "model_done") {
      if (!e.model) return;
      if (SYNTHESIS_NAMES.has(e.model)) {
        setSynthPanel((prev) => prev ? { ...prev, done: true, streaming: false } : null);
      } else {
        setPanels((prev) => prev.map((p) => p.name === e.model ? { ...p, done: true, streaming: false } : p));
      }
    } else if (e.event === "router_done") {
      setRouterInfo(`Router selected: ${e.selected?.join(", ") ?? ""}`);
    } else if (e.event === "synthesis_start") {
      setSynthPanel({ name: e.model ?? "Synthesis", color: "", content: "", done: false, streaming: true });
    } else if (e.event === "done") {
      setLoading(false);
    }
  }, []);

  async function handleSubmit() {
    if (!question.trim() || loading) return;
    setLoading(true); setPanels([]); setSynthPanel(null); setRouterInfo(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamCouncil(mode, question, selectedModel, handleEvent, controller.signal);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleStop() { abortRef.current?.abort(); setLoading(false); }

  const hasPanels = panels.length > 0 || synthPanel !== null;

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">LLM Council</h1>
        <p className="mt-1 text-sm text-gray-500">4 personas · 1 model ({selectedModel}) · multiple perspectives</p>
      </header>
      <ModeSelector selected={mode} onChange={setMode} disabled={loading} />
      <ChatInput value={question} onChange={setQuestion} onSubmit={handleSubmit} loading={loading} onStop={handleStop} models={models} selectedModel={selectedModel} onModelChange={setSelectedModel} />
      {routerInfo && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">🧭 {routerInfo}</div>
      )}
      {hasPanels && (
        <div className="flex flex-col gap-4">
          {panels.length > 0 && (
            <div className={`grid gap-4 ${panels.length === 1 ? "grid-cols-1" : panels.length === 2 ? "grid-cols-1 sm:grid-cols-2" : panels.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
              {panels.map((p) => <ModelPanel key={p.name} panel={p} />)}
            </div>
          )}
          <SynthesisPanel panel={synthPanel} />
        </div>
      )}
      {!hasPanels && !loading && (
        <div className="flex flex-1 items-center justify-center text-gray-700">
          <p className="text-sm">Select a mode and ask something to get started.</p>
        </div>
      )}
    </div>
  );
}
