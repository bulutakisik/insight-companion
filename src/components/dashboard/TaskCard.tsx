import type { SprintTask } from "@/types/dashboard";

interface Props {
  task: SprintTask;
  variant: "in_progress" | "completed" | "queued";
  index: number;
  onClick: () => void;
}

const statusStyles = {
  in_progress: {
    borderLeft: "3px solid hsl(var(--dash-orange))",
    badge: { bg: "hsl(var(--dash-orange-light))", color: "hsl(var(--dash-orange))" },
    label: "Working",
    showPulse: true,
  },
  completed: {
    borderLeft: "3px solid hsl(var(--dash-accent))",
    badge: { bg: "hsl(var(--dash-accent-light))", color: "hsl(var(--dash-accent))" },
    label: "✓ Done",
    showPulse: false,
  },
  queued: {
    borderLeft: "3px solid hsl(var(--dash-border))",
    badge: { bg: "hsl(var(--dash-border-light))", color: "hsl(var(--dash-text-tertiary))" },
    label: "Queued",
    showPulse: false,
  },
};

const TaskCard = ({ task, variant, index, onClick }: Props) => {
  const style = statusStyles[variant];

  return (
    <div
      onClick={onClick}
      className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-px"
      style={{
        background: "hsl(var(--dash-card))",
        border: "1px solid hsl(var(--dash-border))",
        borderLeft: style.borderLeft,
        opacity: variant === "queued" ? 0.6 : 1,
        animationDelay: `${index * 0.05}s`,
        animation: "cardIn 0.4s ease-out both",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: task.agent.color, border: task.agent.hasBorder ? "1px solid #444" : undefined }}
          >
            {task.agent.initials}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--dash-text-secondary))" }}>
            {task.agent.name}
          </span>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-xl" style={{ background: style.badge.bg, color: style.badge.color }}>
          {style.showPulse && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle animate-pulse" style={{ background: "hsl(var(--dash-orange))" }} />}
          {style.label}
        </span>
      </div>
      {/* Title */}
      <div className="text-sm font-semibold leading-snug tracking-tight mb-2">{task.title}</div>
      {/* Description */}
      <div className="text-xs leading-relaxed mb-3" style={{ color: "hsl(var(--dash-text-secondary))" }}>
        {task.description}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-jb-mono" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
          {variant === "queued" ? "Waiting" : variant === "in_progress" ? "In progress" : "Completed"}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
