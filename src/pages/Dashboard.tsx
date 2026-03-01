import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import SprintTimeline from "@/components/dashboard/SprintTimeline";
import ChatDrawer from "@/components/dashboard/ChatDrawer";
import TaskDetailModal from "@/components/dashboard/TaskDetailModal";
import AgentInputToast from "@/components/dashboard/AgentInputToast";
import type { SprintTask, DashboardSession, AgentInfo } from "@/types/dashboard";

// ══════════════════════════════════════════════
// Watchdog Constants
// ══════════════════════════════════════════════
const WATCHDOG_INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes of no streaming activity
const WATCHDOG_MAX_RUNTIME = 30 * 60 * 1000; // 30 minutes absolute maximum
const WATCHDOG_CHECK_INTERVAL = 60 * 1000; // check every 60 seconds

const AGENTS: AgentInfo[] = [
  { key: "pmm", initials: "PM", name: "PMM Agent", color: "#3B82F6", role: "Positioning, messaging, buyer personas" },
  { key: "seo", initials: "SE", name: "SEO Agent", color: "#10B981", role: "Technical SEO, keyword research" },
  { key: "content", initials: "CN", name: "Content Agent", color: "#8B5CF6", role: "Blog posts, case studies" },
  { key: "dev", initials: "DV", name: "Dev Agent", color: "#1A1A1A", role: "Frontend code, landing pages", hasBorder: true },
  { key: "growth", initials: "GR", name: "Growth Agent", color: "#F59E0B", role: "Conversion optimization, funnel analysis" },
  { key: "perf", initials: "PF", name: "Perf Agent", color: "#EF4444", role: "Performance optimization" },
  { key: "social", initials: "SO", name: "Social Agent", color: "#EC4899", role: "Social media, LinkedIn" },
  { key: "intern", initials: "IN", name: "Intern Agent", color: "#6B7280", role: "Analytics setup, tracking" },
  { key: "amplification", initials: "📢", name: "Amplification Agent", color: "#F97316", role: "Distribution & Launch Specialist" },
];

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isTestMode = searchParams.get("test") === "true";
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [activeSprint, setActiveSprint] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<"live" | "history">("live");
  const [selectedTask, setSelectedTask] = useState<SprintTask | null>(null);
  const [dbTasks, setDbTasks] = useState<any[]>([]);
  const [drawerMode, setDrawerMode] = useState<"director" | "agent">("director");
  const [activeConversationTask, setActiveConversationTask] = useState<SprintTask | null>(null);

  // ── Session loader ──
  useEffect(() => {
    const sessionId = searchParams.get("session");
    const isDashboard = searchParams.get("dashboard") === "true";

    if (!sessionId) { navigate("/"); return; }

    supabase
      .from("growth_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { navigate("/"); return; }
        if (!(data as any)?.paid && !isDashboard) { navigate(`/?session=${sessionId}`); return; }
        setSession({
          id: data.id,
          companyUrl: data.company_url || "",
          chatItems: (data.chat_items as any[]) || [],
          conversationHistory: (data.conversation_history as any[]) || [],
          outputCards: (data.output_cards as any[]) || [],
        });
      });
  }, [searchParams, navigate]);

  // ── Fetch tasks ──
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

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Auto-continue: trigger next queued task when one finishes ──
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

  // ── Heartbeat-based watchdog ──
  const failStuckTasks = useCallback(async () => {
    if (!session) return;
    const now = Date.now();
    const stuckTasks: { id: string; reason: string }[] = [];

    for (const t of dbTasks) {
      if (t.status !== "in_progress") continue;

      // Inactivity check: use updated_at as heartbeat proxy
      const lastActivity = t.updated_at ? new Date(t.updated_at).getTime() : 0;
      if (lastActivity > 0 && (now - lastActivity) > WATCHDOG_INACTIVITY_TIMEOUT) {
        stuckTasks.push({ id: t.id, reason: "Agent stalled — no output for 5 minutes" });
        continue;
      }

      // Absolute runtime check
      const startTime = t.started_at ? new Date(t.started_at).getTime() : 0;
      if (startTime > 0 && (now - startTime) > WATCHDOG_MAX_RUNTIME) {
        stuckTasks.push({ id: t.id, reason: "Agent exceeded maximum runtime of 30 minutes" });
      }
    }

    for (const { id, reason } of stuckTasks) {
      console.log(`[Watchdog] Failing task ${id}: ${reason}`);
      await supabase
        .from("sprint_tasks")
        .update({ status: "failed", error_message: reason, completed_at: new Date().toISOString() })
        .eq("id", id);
    }

    if (stuckTasks.length > 0) fetchTasks();
  }, [dbTasks, session, fetchTasks]);

  // ── Polling + watchdog interval ──
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const hasActive = dbTasks.some(t => t.status === "in_progress" || t.status === "queued");

    // Auto-continue detection
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

    // Polling for task updates (every 5s while active)
    if (hasActive && session) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchTasks, 5000);
      }
      // Watchdog (every 60s while active)
      if (!watchdogRef.current) {
        watchdogRef.current = setInterval(failStuckTasks, WATCHDOG_CHECK_INTERVAL);
      }
    } else {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      if (watchdogRef.current) { clearInterval(watchdogRef.current); watchdogRef.current = null; }
    }

    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      if (watchdogRef.current) { clearInterval(watchdogRef.current); watchdogRef.current = null; }
    };
  }, [dbTasks, session, fetchTasks, triggerNextTask, failStuckTasks]);

  // ── Retry handler ──
  const handleRetryTask = useCallback(async (taskId: string) => {
    await supabase
      .from("sprint_tasks")
      .update({
        status: "queued",
        error_message: null,
        started_at: null,
        completed_at: null,
        updated_at: null,
        output_text: null,
        deliverables: [],
        continuation_count: 0,
      })
      .eq("id", taskId);
    setSelectedTask(null);
    await fetchTasks();
    if (session) {
      triggerNextTask();
    }
  }, [fetchTasks, session, triggerNextTask]);

  // ── Test mode: Run single task ──
  const handleRunSingleTask = useCallback(async (taskId: string) => {
    if (!session) return;
    // Mark as queued first (in case it was completed/failed)
    await supabase
      .from("sprint_tasks")
      .update({ status: "queued", error_message: null, started_at: null, completed_at: null, updated_at: null, output_text: null, deliverables: [], continuation_count: 0 })
      .eq("id", taskId);
    await fetchTasks();
    // Fire run-sprint which picks the next queued task
    try {
      await supabase.functions.invoke("run-sprint", {
        body: { session_id: session.id, sprint_number: 1 },
      });
    } catch (e) {
      console.error("Run single task failed:", e);
    }
  }, [session, fetchTasks]);

  // ── Test mode: Stop task ──
  const handleStopTask = useCallback(async (taskId: string) => {
    await supabase
      .from("sprint_tasks")
      .update({ status: "failed", error_message: "Manually stopped by tester", completed_at: new Date().toISOString() })
      .eq("id", taskId);
    await fetchTasks();
  }, [fetchTasks]);

  // ── Test mode: Restart task (reset + run) ──
  const handleRestartTask = useCallback(async (taskId: string) => {
    await handleRunSingleTask(taskId);
  }, [handleRunSingleTask]);

  // ── Test mode: Reset entire sprint ──
  const handleResetSprint = useCallback(async () => {
    if (!session) return;
    const sprintNum = activeSprint + 1;
    // Reset execution tasks → queued
    await supabase
      .from("sprint_tasks")
      .update({
        status: "queued",
        error_message: null,
        started_at: null,
        completed_at: null,
        updated_at: null,
        output_text: null,
        deliverables: [],
        continuation_count: 0,
      })
      .eq("session_id", session.id)
      .eq("sprint_number", sprintNum)
      .eq("task_type", "execution");

    // Reset interactive tasks → waiting_for_input with clean state
    await supabase
      .from("sprint_tasks")
      .update({
        status: "waiting_for_input",
        error_message: null,
        started_at: null,
        completed_at: null,
        updated_at: null,
        output_text: null,
        deliverables: [],
        continuation_count: 0,
        conversation_state: {},
        conversation_messages: [{ role: "assistant", content: "👋 Welcome! Let's get your social media accounts connected. Which platforms would you like to set up?", timestamp: new Date().toISOString() }],
      })
      .eq("session_id", session.id)
      .eq("sprint_number", sprintNum)
      .eq("task_type", "interactive");

    toast.info("Sprint reset — all tasks returned to initial state.");
    await fetchTasks();
  }, [session, activeSprint, fetchTasks]);

  // ── Build sprints from DB tasks ──
  const { sprints, allTasks } = useMemo(() => {
    if (!session) return { sprints: [], allTasks: [] };

    if (dbTasks.length > 0) {
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
          tasks: tasks.map((t: any) => {
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
              taskType: t.task_type || "execution",
              conversationScope: t.conversation_scope,
              conversationMessages: t.conversation_messages || [],
              requiresUserInput: t.requires_user_input || false,
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
    const completed = currentSprintTasks.filter((t: SprintTask) => t.status === "completed");
    const queued = currentSprintTasks.filter((t: SprintTask) => t.status === "queued");
    const failed = currentSprintTasks.filter((t: SprintTask) => t.status === "failed");
    const waitingForInput = currentSprintTasks.filter((t: SprintTask) => t.status === "waiting_for_input");
    return { inProgress, completed, queued, failed, waitingForInput };
  }, [currentSprintTasks]);

  const companyName = useMemo(() => {
    if (!session?.companyUrl) return "Company";
    try {
      const url = session.companyUrl.replace(/^https?:\/\//, "").replace(/^www\./, "");
      return url.split(".")[0].charAt(0).toUpperCase() + url.split(".")[0].slice(1);
    } catch { return session.companyUrl; }
  }, [session]);

  // ── Agent statuses for sidebar ──
  const agentStatuses = useMemo(() => {
    const map: Record<string, { status: "working" | "idle" | "done" | "failed" | "waiting_input"; task: string }> = {};
    for (const agent of AGENTS) {
      const agentTasks = allTasks.filter((t: SprintTask) => t.agent.key === agent.key);
      if (agentTasks.some((t: SprintTask) => t.status === "waiting_for_input")) {
        const waiting = agentTasks.find((t: SprintTask) => t.status === "waiting_for_input")!;
        map[agent.key] = { status: "waiting_input", task: waiting.title };
      } else if (agentTasks.some((t: SprintTask) => t.status === "in_progress")) {
        const active = agentTasks.find((t: SprintTask) => t.status === "in_progress")!;
        map[agent.key] = { status: "working", task: active.title };
      } else if (agentTasks.some((t: SprintTask) => t.status === "failed")) {
        const fail = agentTasks.find((t: SprintTask) => t.status === "failed")!;
        map[agent.key] = { status: "failed", task: `✗ ${fail.title}` };
      } else if (agentTasks.some((t: SprintTask) => t.status === "completed")) {
        const done = agentTasks.find((t: SprintTask) => t.status === "completed")!;
        map[agent.key] = { status: "done", task: `✓ ${done.title}` };
      } else if (agentTasks.length > 0) {
        map[agent.key] = { status: "idle", task: "Queued" };
      } else {
        map[agent.key] = { status: "idle", task: "No tasks" };
      }
    }
    return map;
  }, [allTasks]);

  const handleOpenAgentChat = useCallback((task: SprintTask) => {
    setDrawerMode("agent");
    setActiveConversationTask(task);
    setChatOpen(true);
  }, []);

  const handleSidebarAgentClick = useCallback((agent: AgentInfo) => {
    const waitingTask = allTasks.find(t => t.agent.key === agent.key && t.status === "waiting_for_input");
    if (waitingTask) handleOpenAgentChat(waitingTask);
  }, [allTasks, handleOpenAgentChat]);

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
        onDirectorClick={() => { setDrawerMode("director"); setChatOpen(true); }}
        onAgentClick={handleSidebarAgentClick}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <DashboardTopBar
          sprintTitle={sprints[activeSprint]?.title || "Sprint 1"}
          sprintNumber={activeSprint + 1}
          completed={tasksByStatus.completed.length}
          inProgress={tasksByStatus.inProgress.length}
          queued={tasksByStatus.queued.length}
          failed={tasksByStatus.failed.length}
          total={currentSprintTasks.length}
          sessionId={session?.id}
          onSprintStarted={fetchTasks}
          isTestMode={isTestMode}
          onResetSprint={isTestMode ? handleResetSprint : undefined}
        />

        <KanbanBoard
          inProgress={tasksByStatus.inProgress}
          completed={tasksByStatus.completed}
          queued={tasksByStatus.queued}
          failed={tasksByStatus.failed}
          waitingForInput={tasksByStatus.waitingForInput}
          onTaskClick={setSelectedTask}
          onOpenAgentChat={handleOpenAgentChat}
          isTestMode={isTestMode}
          onRunTask={handleRunSingleTask}
          onStopTask={handleStopTask}
          onRestartTask={handleRestartTask}
        />

        <SprintTimeline
          sprints={sprints}
          activeSprint={activeSprint}
          onSprintClick={setActiveSprint}
        />

        <ChatDrawer
          open={chatOpen}
          onClose={() => { setChatOpen(false); setDrawerMode("director"); setActiveConversationTask(null); }}
          activeTab={chatTab}
          onTabChange={setChatTab}
          chatItems={session?.chatItems || []}
          drawerMode={drawerMode}
          activeConversationTask={activeConversationTask}
          sessionId={session?.id}
          onConversationComplete={() => fetchTasks()}
        />
      </div>

      <TaskDetailModal
        task={selectedTask}
        sprintLabel={sprints[activeSprint]?.number || "S1"}
        onClose={() => setSelectedTask(null)}
        onRetry={handleRetryTask}
      />

      <AgentInputToast
        tasks={allTasks}
        agents={AGENTS}
        onOpenChat={handleOpenAgentChat}
      />
    </div>
  );
};

export default Dashboard;
