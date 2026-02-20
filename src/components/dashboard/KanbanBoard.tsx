import type { SprintTask } from "@/types/dashboard";
import TaskCard from "./TaskCard";

interface Props {
  inProgress: SprintTask[];
  completed: SprintTask[];
  queued: SprintTask[];
  onTaskClick: (task: SprintTask) => void;
}

const KanbanBoard = ({ inProgress, completed, queued, onTaskClick }: Props) => {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
      <div className="grid grid-cols-3 gap-5">
        <Column title="In Progress" count={inProgress.length} dotColor="hsl(var(--dash-orange))" tasks={inProgress} variant="in_progress" onTaskClick={onTaskClick} />
        <Column title="Completed" count={completed.length} dotColor="hsl(var(--dash-accent))" tasks={completed} variant="completed" onTaskClick={onTaskClick} />
        <Column title="Queued" count={queued.length} dotColor="hsl(var(--dash-text-tertiary))" tasks={queued} variant="queued" onTaskClick={onTaskClick} />
      </div>
    </div>
  );
};

interface ColumnProps {
  title: string;
  count: number;
  dotColor: string;
  tasks: SprintTask[];
  variant: "in_progress" | "completed" | "queued";
  onTaskClick: (task: SprintTask) => void;
}

const Column = ({ title, count, dotColor, tasks, variant, onTaskClick }: ColumnProps) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between px-1 mb-1">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--dash-text-secondary))" }}>
          {title}
        </span>
      </div>
      <span className="text-[11px] font-jb-mono px-2 py-0.5 rounded-xl" style={{ color: "hsl(var(--dash-text-tertiary))", background: "hsl(var(--dash-border-light))" }}>
        {count}
      </span>
    </div>
    {tasks.map((task, i) => (
      <TaskCard key={task.id} task={task} variant={variant} index={i} onClick={() => onTaskClick(task)} />
    ))}
    {tasks.length === 0 && (
      <div className="text-center py-8 text-xs" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
        No tasks
      </div>
    )}
  </div>
);

export default KanbanBoard;
