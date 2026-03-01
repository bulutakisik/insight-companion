import { useEffect, useState, useRef } from "react";
import type { AgentInfo, SprintTask } from "@/types/dashboard";

interface Props {
  tasks: SprintTask[];
  agents: AgentInfo[];
  onOpenChat: (task: SprintTask) => void;
}

const AgentInputToast = ({ tasks, agents, onOpenChat }: Props) => {
  const [visible, setVisible] = useState<SprintTask | null>(null);
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const waitingTask = tasks.find(
      t => t.status === "waiting_for_input" && !shownRef.current.has(t.id)
    );
    if (waitingTask) {
      shownRef.current.add(waitingTask.id);
      setVisible(waitingTask);
      const timer = setTimeout(() => setVisible(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [tasks]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-4 py-3 rounded-xl font-dm-sans"
      style={{
        background: "hsl(var(--dash-card))",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        border: "1px solid hsl(var(--dash-border))",
        animation: "toastIn 0.3s ease-out",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
        style={{ background: visible.agent.color }}
      >
        {visible.agent.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate">{visible.agent.name} needs your input</div>
        <div className="text-[12px] truncate" style={{ color: "hsl(var(--dash-text-secondary))" }}>{visible.title}</div>
      </div>
      <button
        onClick={() => { onOpenChat(visible); setVisible(null); }}
        className="text-[12px] font-semibold px-3 py-1.5 rounded-md text-white flex-shrink-0"
        style={{ background: "hsl(var(--dash-accent))" }}
      >
        Open Chat
      </button>
      <button
        onClick={() => setVisible(null)}
        className="text-sm flex-shrink-0 w-6 h-6 flex items-center justify-center rounded"
        style={{ color: "hsl(var(--dash-text-tertiary))" }}
      >
        ✕
      </button>
    </div>
  );
};

export default AgentInputToast;
