import type { SprintTask } from "@/types/dashboard";

interface Props {
  task: SprintTask | null;
  sprintLabel: string;
  onClose: () => void;
}

const TaskDetailModal = ({ task, sprintLabel, onClose }: Props) => {
  if (!task) return null;

  const statusConfig = {
    completed: { text: "✓ Completed", bg: "hsl(var(--dash-accent-light))", color: "hsl(var(--dash-accent))" },
    in_progress: { text: "⏳ In Progress", bg: "hsl(var(--dash-orange-light))", color: "hsl(var(--dash-orange))" },
    queued: { text: "Queued", bg: "hsl(var(--dash-border-light))", color: "hsl(var(--dash-text-tertiary))" },
  };
  const st = statusConfig[task.status];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl w-[600px] max-h-[80vh] overflow-y-auto scrollbar-thin"
        style={{ background: "hsl(var(--dash-card))", boxShadow: "0 24px 64px rgba(0,0,0,0.15)", animation: "modalIn 0.3s cubic-bezier(0.4,0,0.2,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold text-white"
                style={{ background: task.agent.color, border: task.agent.hasBorder ? "1px solid #444" : undefined }}
              >
                {task.agent.initials}
              </div>
              <div>
                <div className="text-[13px] font-semibold">{task.agent.name}</div>
                <div className="text-[11px]" style={{ color: "hsl(var(--dash-text-tertiary))" }}>{task.agent.role}</div>
              </div>
            </div>
            <h2 className="font-dm-serif text-xl tracking-tight mb-1.5">{task.title}</h2>
            <span className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-xl" style={{ background: st.bg, color: st.color }}>
              {st.text}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base cursor-pointer transition-colors"
            style={{ border: "1px solid hsl(var(--dash-border))", background: "hsl(var(--dash-bg))", color: "hsl(var(--dash-text-secondary))" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-4">
          {/* Description */}
          <div className="mb-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--dash-text-tertiary))" }}>Description</div>
            <div className="text-[13px] leading-relaxed" style={{ color: "hsl(var(--dash-text-secondary))" }}>{task.description}</div>
          </div>

          {/* Meta */}
          <div className="mb-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--dash-text-tertiary))" }}>Details</div>
            <div className="grid grid-cols-2 gap-3">
              <MetaItem label="Started" value={task.status === "queued" ? "Not started" : "—"} />
              <MetaItem label="Completed" value={task.status === "completed" ? "—" : "—"} />
              <MetaItem label="Sprint" value={`${sprintLabel} · Week 1`} />
              <MetaItem label="Dependencies" value="None" />
            </div>
          </div>

          {/* Deliverables placeholder for completed tasks */}
          {task.status === "completed" && (
            <div className="mb-5">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--dash-text-tertiary))" }}>Deliverables</div>
              <div className="rounded-xl p-4" style={{ background: "hsl(var(--dash-accent-bg))", border: "1px solid hsl(var(--dash-accent-light))" }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xl">📦</span>
                  <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--dash-accent))" }}>Output Files</span>
                </div>
                <div className="text-xs" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
                  Deliverables will appear here once generated.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetaItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg p-3" style={{ background: "hsl(var(--dash-bg))" }}>
    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "hsl(var(--dash-text-tertiary))" }}>{label}</div>
    <div className="text-[13px] font-semibold">{value}</div>
  </div>
);

export default TaskDetailModal;
