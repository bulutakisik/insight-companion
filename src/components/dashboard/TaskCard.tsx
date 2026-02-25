import type { SprintTask } from "@/types/dashboard";

interface Props {
  task: SprintTask;
  variant: "in_progress" | "completed" | "queued" | "failed";
  index: number;
  onClick: () => void;
  continuationCount?: number;
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

const truncate = (text: string, max: number) =>
  text && text.length > max ? text.slice(0, max) + "…" : text || "";

const TaskCard = ({ task, variant, index, onClick, continuationCount = 0 }: Props) => {
  const style = statusStyles[variant];

  return (
    <div
      onClick={onClick}
      className="rounded-xl px-3.5 py-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-px"
      style={{
        background: "hsl(var(--dash-card))",
        border: "1px solid hsl(var(--dash-border))",
        borderLeft: style.borderLeft,
        opacity: variant === "queued" ? 0.6 : 1,
        animationDelay: `${index * 0.05}s`,
        animation: "cardIn 0.4s ease-out both",
        maxHeight: "120px",
      }}
    >
      {/* Badge */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-xl leading-none"
          style={{ background: style.badge.bg, color: style.badge.color }}
        >
          {style.showPulse && (
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle animate-pulse" style={{ background: "hsl(var(--dash-orange))" }} />
          )}
          {variant === "in_progress" && continuationCount > 0 ? `Part ${continuationCount + 1}` : style.label}
        </span>
      </div>

      {/* Title — max 2 lines */}
      <div
        className="text-[13px] font-semibold leading-snug tracking-tight mb-1"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {task.title}
      </div>

      {/* Description — truncated */}
      <div
        className="text-[11px] leading-relaxed mb-2"
        style={{
          color: "hsl(var(--dash-text-secondary))",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {truncate(task.description, 100)}
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0"
          style={{ background: task.agent.color, border: task.agent.hasBorder ? "1px solid #444" : undefined }}
        >
          {task.agent.initials}
        </div>
        <span className="text-[10px] font-medium truncate" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
          {task.agent.name}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
