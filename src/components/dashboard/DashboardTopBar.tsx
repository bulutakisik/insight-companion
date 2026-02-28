import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  sprintTitle: string;
  sprintNumber: number;
  completed: number;
  inProgress: number;
  queued: number;
  failed: number;
  total: number;
  sessionId?: string;
  onSprintStarted?: () => void;
  isTestMode?: boolean;
}

const DashboardTopBar = ({ sprintTitle, sprintNumber, completed, inProgress, queued, failed, total, sessionId, onSprintStarted, isTestMode }: Props) => {
  const [running, setRunning] = useState(false);

  const handleRunSprint = async () => {
    if (!sessionId || running) return;
    setRunning(true);
    toast.info("Starting sprint… Tasks will update in real-time.");
    try {
      const { error } = await supabase.functions.invoke("run-sprint", {
        body: { session_id: sessionId, sprint_number: sprintNumber },
      });
      if (error) throw error;
      toast.success("Sprint started! Tasks will auto-continue.");
    } catch (e: any) {
      toast.error(`Sprint failed: ${e.message}`);
    } finally {
      setRunning(false);
    }
    onSprintStarted?.();
  };
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center justify-between px-8 py-4 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--dash-border))", background: "hsl(var(--dash-bg))" }}>
      <div className="flex items-center gap-4">
        <h1 className="font-dm-serif text-[22px] tracking-tight" style={{ color: "hsl(0 0% 10%)" }}>{sprintTitle}</h1>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--dash-accent-light))", color: "hsl(var(--dash-accent))" }}>
          Week 1 · Sprint {sprintNumber}
        </span>
      </div>
      <div className="flex items-center gap-5">
        <Stat value={completed} label="Completed" />
        <Divider />
        <Stat value={inProgress} label="In Progress" />
        <Divider />
        <Stat value={queued} label="Queued" />
        {failed > 0 && (
          <>
            <Divider />
            <Stat value={failed} label="Failed" color="hsl(0 84% 60%)" />
          </>
        )}
        <Divider />
        {/* Progress Ring */}
        <div className="w-12 h-12 relative">
          <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
            <circle cx="24" cy="24" r="20" stroke="hsl(var(--dash-border))" strokeWidth="4" fill="none" />
            <circle cx="24" cy="24" r="20" stroke="hsl(var(--dash-accent))" strokeWidth="4" fill="none" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset} />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold font-jb-mono">{pct}%</div>
        </div>
        <Divider />
        <Stat value="7d" label="Remaining" />
        {sessionId && queued > 0 && (
          <>
            <Divider />
            <button
              onClick={handleRunSprint}
              disabled={running}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              style={{
                background: running ? "hsl(var(--dash-border))" : "hsl(var(--dash-accent))",
                color: running ? "hsl(var(--dash-text-tertiary))" : "white",
              }}
            >
              {running ? "Running…" : isTestMode ? "▶ Run All" : "▶ Run Sprint"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const Stat = ({ value, label, color }: { value: number | string; label: string; color?: string }) => (
  <div className="text-center">
    <div className="text-lg font-bold font-jb-mono tracking-tight" style={color ? { color } : undefined}>{value}</div>
    <div className="text-[10px] uppercase tracking-wider" style={{ color: color || "hsl(var(--dash-text-tertiary))" }}>{label}</div>
  </div>
);

const Divider = () => <div className="w-px h-8" style={{ background: "hsl(var(--dash-border))" }} />;

export default DashboardTopBar;
