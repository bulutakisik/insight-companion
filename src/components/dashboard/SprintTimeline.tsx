import type { SprintData } from "@/types/dashboard";

interface Props {
  sprints: SprintData[];
  activeSprint: number;
  onSprintClick: (index: number) => void;
}

const SprintTimeline = ({ sprints, activeSprint, onSprintClick }: Props) => {
  return (
    <div className="px-8 py-3 pb-4 border-t flex-shrink-0" style={{ borderColor: "hsl(var(--dash-border))", background: "hsl(var(--dash-bg))" }}>
      <div className="flex gap-2">
        {sprints.map((sprint, i) => {
          const isActive = i === activeSprint;
          const completedCount = sprint.tasks.filter(t => t.status === "completed").length;
          return (
            <button
              key={i}
              onClick={() => onSprintClick(i)}
              className="flex-1 rounded-lg px-3.5 py-2.5 flex items-center justify-between transition-all"
              style={{
                background: isActive ? "hsl(var(--dash-orange-light))" : "hsl(var(--dash-border-light))",
                border: isActive ? "1.5px solid hsl(var(--dash-orange))" : "1.5px solid transparent",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isActive ? "hsl(var(--dash-orange))" : "hsl(var(--dash-text-tertiary))" }} />
                <div className="text-left">
                  <div className="text-xs font-semibold">{sprint.number}</div>
                  <div className="text-[10px]" style={{ color: "hsl(var(--dash-text-secondary))" }}>{sprint.title}</div>
                </div>
              </div>
              <span
                className="text-[10px] font-jb-mono px-2 py-0.5 rounded-xl"
                style={{
                  background: isActive ? "hsl(var(--dash-orange))" : "hsl(var(--dash-border))",
                  color: isActive ? "white" : "hsl(var(--dash-text-tertiary))",
                }}
              >
                {completedCount}/{sprint.tasks.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SprintTimeline;
