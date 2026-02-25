import type { AgentInfo } from "@/types/dashboard";

interface Props {
  companyName: string;
  companyUrl: string;
  agents: AgentInfo[];
  agentStatuses: Record<string, { status: "working" | "idle" | "done" | "failed"; task: string }>;
  onDirectorClick: () => void;
}

const DashboardSidebar = ({ companyName, companyUrl, agents, agentStatuses, onDirectorClick }: Props) => {
  const cleanUrl = companyUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col" style={{ background: "hsl(var(--dash-sidebar))" }}>
      {/* Header */}
      <div className="p-5 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[15px] text-white" style={{ background: "hsl(var(--dash-accent))" }}>
            L
          </div>
          <span className="font-semibold text-base text-white tracking-tight">LaunchAgent</span>
        </div>
        <div className="rounded-lg p-3" style={{ background: "hsl(var(--dash-sidebar-hover))" }}>
          <div className="text-[13px] font-semibold text-white mb-0.5">{companyName}</div>
          <div className="text-[11px] font-jb-mono" style={{ color: "hsl(var(--dash-text-inverse-secondary))" }}>{cleanUrl}</div>
        </div>
      </div>

      {/* Agent Roster */}
      <div className="p-4 px-3 flex-1 overflow-y-auto scrollbar-thin">
        <div className="text-[10px] font-semibold uppercase tracking-[1.2px] px-2 mb-2.5" style={{ color: "hsl(var(--dash-text-inverse-secondary))" }}>
          Team
        </div>

        {/* Growth Director */}
        <button
          onClick={onDirectorClick}
          className="flex items-center gap-2.5 py-[7px] px-2 rounded-md w-full text-left transition-colors"
          style={{ background: "hsl(var(--dash-sidebar-hover))", outline: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[11px] font-semibold text-white relative" style={{ background: "hsl(var(--dash-accent))" }}>
            GD
            <div className="absolute -bottom-px -right-px w-[9px] h-[9px] rounded-full border-2" style={{ borderColor: "hsl(var(--dash-sidebar))", background: "#22C55E" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">Growth Director</div>
            <div className="text-[10px] truncate" style={{ color: "hsl(var(--dash-text-inverse-secondary))" }}>Ask me anything</div>
          </div>
        </button>

        <div className="h-px my-2 mx-2" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Agents */}
        {agents.map((agent) => {
          const st = agentStatuses[agent.key] || { status: "idle", task: "No tasks" };
          const dotColor =
            st.status === "working" ? "#F59E0B" :
            st.status === "done" ? "#22C55E" :
            st.status === "failed" ? "#EF4444" :
            "#6B7280";

          return (
            <div
              key={agent.key}
              className="flex items-center gap-2.5 py-[7px] px-2 rounded-md cursor-default transition-colors hover:bg-white/[0.06]"
            >
              <div
                className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[11px] font-semibold text-white relative flex-shrink-0"
                style={{ background: agent.color, border: agent.hasBorder ? "1px solid #444" : undefined }}
              >
                {agent.initials}
                <div
                  className="absolute -bottom-px -right-px w-[9px] h-[9px] rounded-full border-2"
                  style={{ borderColor: "hsl(var(--dash-sidebar))", background: dotColor }}
                />
                {st.status === "working" && (
                  <div
                    className="absolute -bottom-px -right-px w-[9px] h-[9px] rounded-full border-2 animate-ping"
                    style={{ borderColor: "hsl(var(--dash-sidebar))", background: "#F59E0B" }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{agent.name}</div>
                <div className="text-[10px] truncate" style={{ color: "hsl(var(--dash-text-inverse-secondary))" }}>{st.task}</div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default DashboardSidebar;
