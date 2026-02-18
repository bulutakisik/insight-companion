export type ConversationPhase = 0 | 1 | 2 | 3;

export interface ChatMessage {
  id: string;
  sender: "user" | "director";
  html: string;
  timestamp: number;
}

export interface StreamItem {
  icon: string;
  text: string;
  done?: boolean;
}

export interface StreamBlockData {
  id: string;
  items: StreamItem[];
  summary?: string;
}

export interface ProgressStep {
  id: number;
  label: string;
  state: "pending" | "active" | "done";
}

// Output card data types
export interface ProductAnalysisData {
  company: {
    name: string;
    logo: string;
    description: string;
    tags: string[];
  };
  modules: {
    name: string;
    description: string;
    type: "core" | "unique";
  }[];
}

export interface CompetitorRow {
  metric: string;
  values: { text: string; status?: "win" | "lose" | "mid" }[];
}

export interface CompetitiveData {
  headers: string[];
  rows: CompetitorRow[];
}

export interface FunnelStage {
  label: string;
  value: string;
  sub?: string;
  subtitle?: string;
  color: "red" | "orange" | "green";
}

export interface FunnelData {
  stages: FunnelStage[];
  bottleneck: {
    title: string;
    description: string;
  };
}

export interface SprintTask {
  agent: string;
  agentClass: string;
  task: string;
}

export interface Sprint {
  number: string;
  title: string;
  tasks: SprintTask[];
}

export interface WorkStatementData {
  sprints: Sprint[];
}

export interface PaywallData {
  title: string;
  description: string;
  ctaText: string;
  price: string;
}

export type OutputCard =
  | { type: "product_analysis"; data: ProductAnalysisData }
  | { type: "competitive_landscape"; data: CompetitiveData }
  | { type: "funnel_diagnosis"; data: FunnelData }
  | { type: "work_statement"; data: WorkStatementData }
  | { type: "paywall"; data: PaywallData };

export interface SessionState {
  id: string;
  phase: ConversationPhase;
  messages: ChatMessage[];
  streamBlocks: StreamBlockData[];
  outputCards: OutputCard[];
  progressSteps: ProgressStep[];
}
