import type { SprintTask } from "@/types/dashboard";

interface Props {
  task: SprintTask;
  variant: "in_progress" | "completed" | "queued" | "failed" | "waiting_for_input";
  index: number;
  onClick: () => void;
  continuationCount?: number;
  isTestMode?: boolean;
  onRun?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  onOpenChat?: () => void;
}

const statusStyles: Record<string, { borderLeft: string; badge: { bg: string; color: string }; label: string; showPulse: boolean }> = {
  in_progress: {
    borderLeft: "3px solid hsl(var(--dash-orange))",
    badge: { bg: "hsl(var(--dash-orange-light))", color: "hsl(var(--dash-orange))" },
    label: "Working",
    showPulse: true,
  },
  waiting_for_input: {
    borderLeft: "3px solid hsl(var(--dash-orange))",
    badge: { bg: "hsl(var(--dash-orange-light))", color: "hsl(var(--dash-orange))" },
    label: "⏳ Needs Input",
    showPulse: false,
  },
  completed: {
    borderLeft: "3px solid hsl(var(--dash-accent))",
    badge: { bg: "hsl(var(--dash-accent-light))", color: "hsl(var(--dash-accent))" },
    label: "✓ Done",
    showPulse: false,
  },
  failed: {
    borderLeft: "3px solid hsl(0 84% 60%)",
    badge: { bg: "hsl(0 84% 95%)", color: "hsl(0 84% 60%)" },
    label: "✗ Failed",
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

const TaskCard = ({ task, variant, index, onClick, continuationCount = 0, isTestMode, onRun, onStop, onRestart, onOpenChat }: Props) => {
  const style = statusStyles[variant] || statusStyles.queued;
  const isInteractiveWaiting = variant === "waiting_for_input";

  const handleClick = () => {
    if (isInteractiveWaiting && onOpenChat) {
      onOpenChat();
    } else {
      onClick();
    }
  };

  const stopPropagation = (e: React.MouseEvent, handler?: () => void) => {
    e.stopPropagation();
    handler?.();
  };

  return (
    <div
      onClick={handleClick}
      className="rounded-xl px-3.5 py-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-px overflow-hidden flex flex-col"
      style={{
        background: "hsl(var(--dash-card))",
        border: "1px solid hsl(var(--dash-border))",
        borderLeft: style.borderLeft,
        opacity: variant === "queued" ? 0.6 : 1,
        animationDelay: `${index * 0.05}s`,
        animation: "cardIn 0.4s ease-out both",
        minHeight: isTestMode ? "110px" : "90px",
        maxHeight: variant === "failed" ? "170px" : isTestMode ? "160px" : "130px",
      }}
    >
      {/* Badge */}
      <div className="flex items-center mb-1.5 shrink-0">
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

      {/* Title */}
      <div
        className="text-[13px] font-semibold leading-snug tracking-tight mb-0.5 shrink-0"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {task.title}
      </div>

      {/* Failed reason */}
      {variant === "failed" && task.errorMessage && (
        <div
          className="text-[10px] leading-snug mb-0.5 shrink-0"
          style={{
            color: "hsl(0 84% 60%)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {task.errorMessage}
        </div>
      )}

      {/* Description */}
      {variant !== "failed" && !isInteractiveWaiting && (
        <div
          className="text-[11px] leading-relaxed flex-1 min-h-0"
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
      )}

      {/* Open Chat button for waiting_for_input */}
      {isInteractiveWaiting && (
        <div className="flex-1 flex items-end">
          <button
            onClick={(e) => stopPropagation(e, onOpenChat)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors"
            style={{ background: `${task.agent.color}18`, color: task.agent.color }}
          >
            💬 Open Chat
          </button>
        </div>
      )}

      {/* Assignee */}
      <div className="flex items-center gap-1.5 mt-1.5 shrink-0">
        <div
          className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white shrink-0"
          style={{ background: task.agent.color, border: task.agent.hasBorder ? "1px solid #444" : undefined }}
        >
          {task.agent.initials}
        </div>
        <span className="text-[10px] font-medium truncate" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
          {task.agent.name}
        </span>
      </div>

      {/* Test mode controls — hidden for interactive tasks */}
      {isTestMode && task.taskType !== "interactive" && (
        <div className="flex items-center gap-1.5 mt-2 pt-1.5 shrink-0" style={{ borderTop: "1px solid hsl(var(--dash-border))" }}>
          {(variant === "queued" || variant === "completed" || variant === "failed") && (
            <button
              onClick={(e) => stopPropagation(e, variant === "queued" ? onRun : onRestart)}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-md transition-colors"
              style={{ background: "hsl(var(--dash-accent-light))", color: "hsl(var(--dash-accent))" }}
            >
              {variant === "queued" ? "▶ Run" : "↻ Restart"}
            </button>
          )}
          {variant === "in_progress" && (
            <button
              onClick={(e) => stopPropagation(e, onStop)}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-md transition-colors"
              style={{ background: "hsl(0 84% 95%)", color: "hsl(0 84% 60%)" }}
            >
              ⏹ Stop
            </button>
          )}
          {variant === "in_progress" && (
            <button
              onClick={(e) => stopPropagation(e, onRestart)}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-md transition-colors"
              style={{ background: "hsl(var(--dash-orange-light))", color: "hsl(var(--dash-orange))" }}
            >
              ↻ Restart
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
