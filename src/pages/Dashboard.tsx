import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import SprintTimeline from "@/components/dashboard/SprintTimeline";
import ChatDrawer from "@/components/dashboard/ChatDrawer";
import TaskDetailModal from "@/components/dashboard/TaskDetailModal";
import type { SprintTask, DashboardSession, AgentInfo } from "@/types/dashboard";

const AGENTS: AgentInfo[] = [
  { key: "pmm", initials: "PM", name: "PMM Agent", color: "#3B82F6", role: "Positioning, messaging, buyer personas" },
  { key: "seo", initials: "SE", name: "SEO Agent", color: "#10B981", role: "Technical SEO, keyword research" },
  { key: "content", initials: "CN", name: "Content Agent", color: "#8B5CF6", role: "Blog posts, case studies" },
  { key: "dev", initials: "DV", name: "Dev Agent", color: "#1A1A1A", role: "Frontend code, landing pages", hasBorder: true },
  { key: "growth", initials: "GR", name: "Growth Agent", color: "#F59E0B", role: "Conversion optimization, funnel analysis" },
  { key: "perf", initials: "PF", name: "Perf Agent", color: "#EF4444", role: "Performance optimization" },
  { key: "social", initials: "SO", name: "Social Agent", color: "#EC4899", role: "Social media, LinkedIn" },
  { key: "intern", initials: "IN", name: "Intern Agent", color: "#6B7280", role: "Analytics setup, tracking" },
];

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [activeSprint, setActiveSprint] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<"live" | "history">("live");
  const [selectedTask, setSelectedTask] = useState<SprintTask | null>(null);
  const [dbTasks, setDbTasks] = useState<any[]>([]);
  useEffect(() => {
    const sessionId = searchParams.get("session");
    const isDashboard = searchParams.get("dashboard") === "true";

    if (!sessionId) {
      navigate("/");
      return;
    }

    supabase
      .from("growth_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          navigate("/");
          return;
        }
        if (!(data as any)?.paid && !isDashboard) {
          navigate(`/?session=${sessionId}`);
          return;
        }
        setSession({
          id: data.id,
          companyUrl: data.company_url || "",
          chatItems: (data.chat_items as any[]) || [],
          conversationHistory: (data.conversation_history as any[]) || [],
          outputCards: (data.output_cards as any[]) || [],
        });
      });
  }, [searchParams, navigate]);

  // Fetch tasks from sprint_tasks table
  const fetchTasks = useCallback(() => {
    if (!session) return;
    supabase
      .from("sprint_tasks")
      .select("*")
      .eq("session_id", session.id)
      .order("sprint_number")
      .order("created_at")
      .then(({ data }) => {
        if (data) setDbTasks(data);
        setLoading(false);
      });
  }, [session]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Poll every 5s while any task is in_progress or queued
  // Auto-continue: when a task completes and queued tasks remain, call run-sprint again
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTasksRef = useRef<any[]>([]);

  const triggerNextTask = useCallback(async () => {
    if (!session) return;
    try {
      await supabase.functions.invoke("run-sprint", {
        body: { session_id: session.id, sprint_number: 1 },
      });
    } catch (e) {
      console.error("Auto-continue failed:", e);
    }
  }, [session]);

  // Stuck task watchdog: auto-fail tasks with updated_at > 10 minutes old
  const failStuckTasks = useCallback(async () => {
    if (!session) return;
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const stuckTasks = dbTasks.filter(
      t => t.status === "in_progress" && t.updated_at && t.updated_at < tenMinAgo
    );
    for (const task of stuckTasks) {
      console.log(`[Watchdog] Marking task ${task.id} as timed out (updated_at: ${task.updated_at})`);
      await supabase
        .from("sprint_tasks")
        .update({ status: "failed", error_message: "Task timed out", completed_at: new Date().toISOString() })
        .eq("id", task.id);
    }
    if (stuckTasks.length > 0) {
      fetchTasks(); // refresh after marking failures
    }
  }, [dbTasks, session, fetchTasks]);

  useEffect(() => {
    const hasActive = dbTasks.some(t => t.status === "in_progress" || t.status === "queued");

    // Stuck task watchdog check
    failStuckTasks();

    // Auto-continue: detect task completion and trigger next
    if (prevTasksRef.current.length > 0 && dbTasks.length > 0) {
      const prevInProgress = prevTasksRef.current.filter(t => t.status === "in_progress");
      const nowCompleted = dbTasks.filter(t => t.status === "completed" || t.status === "failed");
      const justFinished = prevInProgress.some(p =>
        nowCompleted.some(c => c.id === p.id && p.status === "in_progress")
      );
      const hasQueued = dbTasks.some(t => t.status === "queued");
      const noneInProgress = !dbTasks.some(t => t.status === "in_progress");

      if (justFinished && hasQueued && noneInProgress) {
        triggerNextTask();
      }
    }
    prevTasksRef.current = dbTasks;

    if (hasActive && session) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchTasks, 5000);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [dbTasks, session, fetchTasks, triggerNextTask, failStuckTasks]);

  // Build sprints from DB tasks, falling back to output_cards
  const { sprints, allTasks } = useMemo(() => {
    if (!session) return { sprints: [], allTasks: [] };

    if (dbTasks.length > 0) {
      // Group DB tasks by sprint_number
      const sprintMap = new Map<number, any[]>();
      for (const t of dbTasks) {
        const sn = t.sprint_number;
        if (!sprintMap.has(sn)) sprintMap.set(sn, []);
        sprintMap.get(sn)!.push(t);
      }

      const sprints = Array.from(sprintMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([num, tasks], si) => ({
          number: `S${num}`,
          title: `Sprint ${num}`,
          tasks: tasks.map((t: any, ti: number) => {
            const agentKey = (t.agent || "").toLowerCase().replace(/\s+agent$/i, "");
            const agent = AGENTS.find(a => a.key === agentKey) || AGENTS[7];
            return {
              id: t.id,
              sprintIndex: si,
              agent,
              title: t.task_title,
              status: t.status as SprintTask["status"],
              description: t.task_description || "",
              startedAt: t.started_at,
              completedAt: t.completed_at,
              deliverables: t.deliverables || [],
              outputText: t.output_text,
              errorMessage: t.error_message,
              continuationCount: t.continuation_count || 0,
            };
          }),
        }));

      const allTasks = sprints.flatMap(s => s.tasks);
      return { sprints, allTasks };
    }

    // Fallback: read from work_statement output card
    const wsCard = session.outputCards.find((c: any) => c.type === "work_statement");
    const wsData = (wsCard as any)?.data;
    const rawSprints = wsData?.sprints || [];

    const sprints = rawSprints.map((s: any, si: number) => ({
      number: s.number || `S${si + 1}`,
      title: s.title || `Sprint ${si + 1}`,
      tasks: (s.tasks || []).map((t: any, ti: number) => {
        const agentKey = (t.agentClass || t.agent || "").toLowerCase().replace(/\s+agent$/i, "");
        const agent = AGENTS.find(a => a.key === agentKey) || AGENTS[7];
        return {
          id: `${si}-${ti}`,
          sprintIndex: si,
          agent,
          title: t.task || "Untitled task",
          status: "queued" as const,
          description: t.task || "",
        };
      }),
    }));

    const allTasks = sprints.flatMap((s: any) => s.tasks);
    return { sprints, allTasks };
  }, [session, dbTasks]);

  const currentSprintTasks = useMemo(() => {
    return allTasks.filter((t: SprintTask) => t.sprintIndex === activeSprint);
  }, [allTasks, activeSprint]);

  const tasksByStatus = useMemo(() => {
    const inProgress = currentSprintTasks.filter((t: SprintTask) => t.status === "in_progress");
    const completed = currentSprintTasks.filter((t: SprintTask) => t.status === "completed" || t.status === "failed");
    const queued = currentSprintTasks.filter((t: SprintTask) => t.status === "queued");
    return { inProgress, completed, queued };
  }, [currentSprintTasks]);

  // Get company name from URL
  const companyName = useMemo(() => {
    if (!session?.companyUrl) return "Company";
    try {
      const url = session.companyUrl.replace(/^https?:\/\//, "").replace(/^www\./, "");
      return url.split(".")[0].charAt(0).toUpperCase() + url.split(".")[0].slice(1);
    } catch {
      return session.companyUrl;
    }
  }, [session]);

  // Derive agent statuses from tasks
  const agentStatuses = useMemo(() => {
    const map: Record<string, { status: "working" | "idle" | "done"; task: string }> = {};
    for (const agent of AGENTS) {
      const agentTasks = allTasks.filter((t: SprintTask) => t.agent.key === agent.key);
      if (agentTasks.some((t: SprintTask) => t.status === "in_progress")) {
        const active = agentTasks.find((t: SprintTask) => t.status === "in_progress")!;
        map[agent.key] = { status: "working", task: active.title };
      } else if (agentTasks.some((t: SprintTask) => t.status === "completed" || t.status === "failed")) {
        const done = agentTasks.find((t: SprintTask) => t.status === "completed" || t.status === "failed")!;
        map[agent.key] = { status: "done", task: `✓ ${done.title}` };
      } else if (agentTasks.length > 0) {
        map[agent.key] = { status: "idle", task: "Queued" };
      } else {
        map[agent.key] = { status: "idle", task: "No tasks" };
      }
    }
    return map;
  }, [allTasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--dash-bg))] flex items-center justify-center">
        <div className="text-[hsl(var(--dash-text-tertiary))] text-sm animate-pulse font-dm-sans">Loading…</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden font-dm-sans" style={{ background: "hsl(var(--dash-bg))" }}>
      <DashboardSidebar
        companyName={companyName}
        companyUrl={session?.companyUrl || ""}
        agents={AGENTS}
        agentStatuses={agentStatuses}
        onDirectorClick={() => setChatOpen(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <DashboardTopBar
          sprintTitle={sprints[activeSprint]?.title || "Sprint 1"}
          sprintNumber={activeSprint + 1}
          completed={tasksByStatus.completed.length}
          inProgress={tasksByStatus.inProgress.length}
          queued={tasksByStatus.queued.length}
          total={currentSprintTasks.length}
          sessionId={session?.id}
          onSprintStarted={fetchTasks}
        />

        <KanbanBoard
          inProgress={tasksByStatus.inProgress}
          completed={tasksByStatus.completed}
          queued={tasksByStatus.queued}
          onTaskClick={setSelectedTask}
        />

        <SprintTimeline
          sprints={sprints}
          activeSprint={activeSprint}
          onSprintClick={setActiveSprint}
        />

        <ChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          activeTab={chatTab}
          onTabChange={setChatTab}
          chatItems={session?.chatItems || []}
        />
      </div>

      <TaskDetailModal
        task={selectedTask}
        sprintLabel={sprints[activeSprint]?.number || "S1"}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
};

export default Dashboard;
