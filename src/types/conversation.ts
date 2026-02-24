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

// New card data types
export interface BusinessModelData {
  model_type: string;
  description: string;
  metrics: { label: string; value: string; benchmark?: string }[];
}

export interface ICPProfileData {
  primary_persona: {
    title: string;
    company_size: string;
    industry: string;
    pain_points: string[];
    buying_triggers: string[];
  };
  secondary_persona?: {
    title: string;
    company_size: string;
    industry: string;
    pain_points: string[];
    buying_triggers: string[];
  } | null;
  user_vs_buyer: string;
}

export interface USPData {
  usps: { title: string; description: string; competitive_context?: string }[];
  unfair_advantage: string;
}

export interface VisionStatementData {
  statement: string;
  product?: string;
  audience?: string;
  outcome?: string;
  differentiator?: string;
  validation_note?: string;
}

export interface ChannelsAndConstraintsData {
  current_channels: { channel: string; contribution: string }[];
  failed_experiments: string[];
  budget: { monthly_spend: string; constraints: string };
}

// Fixed card ordering
export const CARD_TYPE_ORDER: string[] = [
  "product_analysis",
  "business_model",
  "icp_profile",
  "competitive_landscape",
  "usp",
  "vision_statement",
  "channels_and_constraints",
  "funnel_diagnosis",
  "work_statement",
  "paywall",
];

export type OutputCard =
  | { type: "product_analysis"; data: ProductAnalysisData }
  | { type: "business_model"; data: BusinessModelData }
  | { type: "icp_profile"; data: ICPProfileData }
  | { type: "competitive_landscape"; data: CompetitiveData }
  | { type: "usp"; data: USPData }
  | { type: "vision_statement"; data: VisionStatementData }
  | { type: "channels_and_constraints"; data: ChannelsAndConstraintsData }
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
