import type { SprintTask } from "@/types/dashboard";
import TaskCard from "./TaskCard";

interface Props {
  inProgress: SprintTask[];
  completed: SprintTask[];
  queued: SprintTask[];
  failed: SprintTask[];
  onTaskClick: (task: SprintTask) => void;
  isTestMode?: boolean;
  onRunTask?: (taskId: string) => void;
  onStopTask?: (taskId: string) => void;
  onRestartTask?: (taskId: string) => void;
}

const KanbanBoard = ({ inProgress, completed, queued, failed, onTaskClick, isTestMode, onRunTask, onStopTask, onRestartTask }: Props) => {
  const showFailed = failed.length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
      <div className={`grid gap-5 ${showFailed ? "grid-cols-4" : "grid-cols-3"}`}>
        <Column title="In Progress" count={inProgress.length} dotColor="hsl(var(--dash-orange))" tasks={inProgress} variant="in_progress" onTaskClick={onTaskClick} isTestMode={isTestMode} onRunTask={onRunTask} onStopTask={onStopTask} onRestartTask={onRestartTask} />
        <Column title="Completed" count={completed.length} dotColor="hsl(var(--dash-accent))" tasks={completed} variant="completed" onTaskClick={onTaskClick} isTestMode={isTestMode} onRunTask={onRunTask} onStopTask={onStopTask} onRestartTask={onRestartTask} />
        <Column title="Queued" count={queued.length} dotColor="hsl(var(--dash-text-tertiary))" tasks={queued} variant="queued" onTaskClick={onTaskClick} isTestMode={isTestMode} onRunTask={onRunTask} onStopTask={onStopTask} onRestartTask={onRestartTask} />
        {showFailed && (
          <Column title="Failed" count={failed.length} dotColor="hsl(0 84% 60%)" tasks={failed} variant="failed" onTaskClick={onTaskClick} isTestMode={isTestMode} onRunTask={onRunTask} onStopTask={onStopTask} onRestartTask={onRestartTask} />
        )}
      </div>
    </div>
  );
};

interface ColumnProps {
  title: string;
  count: number;
  dotColor: string;
  tasks: SprintTask[];
  variant: "in_progress" | "completed" | "queued" | "failed";
  onTaskClick: (task: SprintTask) => void;
  isTestMode?: boolean;
  onRunTask?: (taskId: string) => void;
  onStopTask?: (taskId: string) => void;
  onRestartTask?: (taskId: string) => void;
}

const Column = ({ title, count, dotColor, tasks, variant, onTaskClick, isTestMode, onRunTask, onStopTask, onRestartTask }: ColumnProps) => (
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
      <TaskCard
        key={task.id}
        task={task}
        variant={variant}
        index={i}
        onClick={() => onTaskClick(task)}
        continuationCount={task.continuationCount}
        isTestMode={isTestMode}
        onRun={onRunTask ? () => onRunTask(task.id) : undefined}
        onStop={onStopTask ? () => onStopTask(task.id) : undefined}
        onRestart={onRestartTask ? () => onRestartTask(task.id) : undefined}
      />
    ))}
    {tasks.length === 0 && (
      <div className="text-center py-8 text-xs" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
        No tasks
      </div>
    )}
  </div>
);

export default KanbanBoard;
