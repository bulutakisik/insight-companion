export interface AgentInfo {
  key: string;
  initials: string;
  name: string;
  color: string;
  role: string;
  hasBorder?: boolean;
}

export interface SprintTask {
  id: string;
  sprintIndex: number;
  agent: AgentInfo;
  title: string;
  status: "queued" | "in_progress" | "completed" | "failed" | "waiting_for_input";
  taskType?: "execution" | "interactive";
  conversationScope?: string | null;
  conversationMessages?: any[];
  requiresUserInput?: boolean;
  description: string;
  startedAt?: string | null;
  completedAt?: string | null;
  deliverables?: any[];
  outputText?: string | null;
  errorMessage?: string | null;
  continuationCount?: number;
}

export interface SprintData {
  number: string;
  title: string;
  tasks: SprintTask[];
}

export interface DashboardSession {
  id: string;
  companyUrl: string;
  chatItems: any[];
  conversationHistory: any[];
  outputCards: any[];
}
