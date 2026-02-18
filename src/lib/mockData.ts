import {
  ChatMessage,
  StreamBlockData,
  StreamItem,
  OutputCard,
  ProductAnalysisData,
  CompetitiveData,
  FunnelData,
  WorkStatementData,
  PaywallData,
} from "@/types/conversation";

let msgId = 0;
const nextId = () => `msg-${++msgId}`;

function msg(sender: "user" | "director", html: string): ChatMessage {
  return { id: nextId(), sender, html, timestamp: Date.now() };
}

// Mock streaming data
const productStreamItems: StreamItem[] = [
  { icon: "🔍", text: 'Searching <strong>the website</strong>' },
  { icon: "📄", text: 'Reading homepage — "Automated Security Validation Platform"' },
  { icon: "📄", text: 'Reading /platform — found <strong>6 product modules</strong>' },
  { icon: "📄", text: 'Reading /about — Series C, $80M raised' },
  { icon: "📄", text: 'Reading /customers — Visa, ING, DHL, BMW' },
  { icon: "⭐", text: 'Analyzing G2 reviews — <strong>200+ reviews, 4.9/5</strong>' },
  { icon: "🧠", text: 'DRV module identified as <strong>unique — no competitor has this</strong>' },
  { icon: "⭐", text: '40% of reviews mention one-click mitigations' },
];

const competitorStreamItems: StreamItem[] = [
  { icon: "⚔️", text: 'Identifying top competitors in security validation' },
  { icon: "🔍", text: 'Researching <strong>Pentera</strong> — pentera.io' },
  { icon: "📄", text: 'Found: $250M raised, $100M+ ARR, 1,100 customers' },
  { icon: "📄", text: '2 acquisitions late 2025 (DevOcean, EVA)' },
  { icon: "🔍", text: 'Researching <strong>Cymulate</strong> — cymulate.com' },
  { icon: "📄", text: 'Found: $179M raised, new Exposure Management Platform' },
  { icon: "⚠️", text: "Your homepage is <strong>indistinguishable from Pentera's</strong>" },
];

const numbersStreamItems: StreamItem[] = [
  { icon: "🔢", text: 'Processing AARRR funnel metrics' },
  { icon: "🧮", text: 'Target: $44M − $30M = <strong>$14M net-new needed</strong>' },
  { icon: "🧮", text: '$14M ÷ $120K ACV = <strong>125 deals needed/year</strong>' },
  { icon: "🧮", text: 'Current: 55 demos × 50% × 15% = <strong>~4 deals/month = 48/year</strong>' },
  { icon: "🚨", text: '<strong>Gap: 77 deals short — $9.2M missing</strong>' },
  { icon: "🧠", text: 'Root cause: 0.09% website conversion + 15% close rate' },
];

const workStatementStreamItems: StreamItem[] = [
  { icon: "📋", text: 'Building Sprint 1 — positioning foundation + audits' },
  { icon: "📋", text: 'Building Sprint 2 — battle cards + campaigns launch' },
  { icon: "📋", text: 'Building Sprint 3 — enablement + growth experiments' },
  { icon: "📋", text: 'Building Sprint 4 — measure + scale + iterate' },
  { icon: "🧠", text: 'Assigned <strong>42 deliverables</strong> across <strong>8 agents</strong>' },
];

// Output card mock data
export const mockProductData: ProductAnalysisData = {
  company: {
    name: "Picus Security",
    logo: "P",
    description: "Automated Security Validation — attack simulation, detection validation, and actionable remediation for enterprise security teams.",
    tags: ["Series C · $80M", "500+ customers", "$120K ACV", "120% NDR"],
  },
  modules: [
    { name: "Security Control Validation", description: "Attack simulation across kill chain", type: "core" },
    { name: "Detection Rule Validation", description: "Validate SIEM/EDR detection rules", type: "unique" },
    { name: "Attack Surface Validation", description: "External exposure analysis", type: "core" },
    { name: "Cloud Security Validation", description: "Cloud posture validation", type: "core" },
    { name: "Exposure Validation", description: "Real exploitation testing", type: "core" },
    { name: "Attack Path Validation", description: "Lateral movement mapping", type: "core" },
  ],
};

export const mockCompetitiveData: CompetitiveData = {
  headers: ["", "Picus", "Pentera", "Cymulate"],
  rows: [
    { metric: "Funding", values: [{ text: "$80M", status: "mid" }, { text: "$250M", status: "win" }, { text: "$179M" }] },
    { metric: "ARR", values: [{ text: "$30M" }, { text: "$100M+", status: "win" }, { text: "—" }] },
    { metric: "G2 Rating", values: [{ text: "4.9/5", status: "win" }, { text: "4.5/5" }, { text: "4.7/5" }] },
    { metric: "One-click Fix", values: [{ text: "✓ Unique", status: "win" }, { text: "✗", status: "lose" }, { text: "✗", status: "lose" }] },
    { metric: "DRV", values: [{ text: "✓ Unique", status: "win" }, { text: "✗", status: "lose" }, { text: "✗", status: "lose" }] },
    { metric: "Homepage", values: [{ text: "Generic", status: "mid" }, { text: "AI-Powered™" }, { text: "CTEM" }] },
  ],
};

export const mockFunnelData: FunnelData = {
  stages: [
    { label: "Acquisition", value: "60K", sub: "visitors/mo", color: "orange" },
    { label: "Activation", value: "55", sub: "demos · 0.09%", color: "red" },
    { label: "Conversion", value: "~4", sub: "closed · 15%", color: "red" },
    { label: "Revenue", value: "$30M", sub: "$120K ACV", color: "green" },
    { label: "Retention", value: "120%", sub: "NDR", color: "green" },
  ],
  bottleneck: {
    title: "Primary Bottleneck: Positioning",
    description: '0.09% demo conversion (benchmark 0.2–0.4%) and ~15% close rate. Both caused by indistinguishable positioning. Fixing messaging attacks both leaks from the same 60K visitors.',
  },
};

export const mockWorkStatementData: WorkStatementData = {
  sprints: [
    {
      number: "S1",
      title: "Foundation — Week 1",
      tasks: [
        { agent: "PMM", agentClass: "pmm", task: "Positioning framework" },
        { agent: "SEO", agentClass: "seo", task: "Full SEO audit" },
        { agent: "CONTENT", agentClass: "content", task: "Blog posts ×2" },
        { agent: "DEV", agentClass: "dev", task: "Homepage hero rebuild" },
        { agent: "HACK", agentClass: "growth", task: "Growth audit + 4 ideas" },
        { agent: "INTERN", agentClass: "intern", task: "GSC + GA4 setup" },
      ],
    },
    {
      number: "S2",
      title: "Launch — Week 2",
      tasks: [
        { agent: "PMM", agentClass: "pmm", task: "Battle cards ×2" },
        { agent: "SEO", agentClass: "seo", task: "Content briefs ×4" },
        { agent: "CONTENT", agentClass: "content", task: "Blogs ×4 + emails" },
        { agent: "DEV", agentClass: "dev", task: "Landing page ×1" },
        { agent: "PERF", agentClass: "perf", task: "Campaigns + ads ×6" },
        { agent: "SOCIAL", agentClass: "social", task: "Posts ×12" },
      ],
    },
    {
      number: "S3",
      title: "Enable — Week 3",
      tasks: [
        { agent: "PMM", agentClass: "pmm", task: "Sales deck" },
        { agent: "SEO", agentClass: "seo", task: "Technical fixes" },
        { agent: "CONTENT", agentClass: "content", task: "Case study + copy ×2" },
        { agent: "DEV", agentClass: "dev", task: "Growth hack build" },
        { agent: "HACK", agentClass: "growth", task: "Measure top 2" },
        { agent: "SOCIAL", agentClass: "social", task: "Posts ×12" },
      ],
    },
    {
      number: "S4",
      title: "Scale — Week 4",
      tasks: [
        { agent: "PMM", agentClass: "pmm", task: "Messaging audit" },
        { agent: "SEO", agentClass: "seo", task: "Rankings report" },
        { agent: "CONTENT", agentClass: "content", task: "Blogs ×4 + whitepaper" },
        { agent: "DEV", agentClass: "dev", task: "ROI calculator" },
        { agent: "PERF", agentClass: "perf", task: "Scaling plan" },
        { agent: "HACK", agentClass: "growth", task: "4 new ideas" },
        { agent: "SOCIAL", agentClass: "social", task: "Posts ×12 + report" },
      ],
    },
  ],
};

export const mockPaywallData: PaywallData = {
  title: "Your growth team is ready",
  description: "The world's first humanless agentic growth team.\n8 AI agents. Weekly sprints. Real deliverables.",
  ctaText: "Start Sprint 1 →",
  price: "$499/month · All agents · Cancel anytime",
};

// Simulation sequences for each phase
export interface SimulationStep {
  type: "message" | "stream" | "outputCard" | "progress" | "wait" | "whatsNext" | "enableInput";
  data?: any;
}

export function getPhase0Sequence(url: string): SimulationStep[] {
  return [
    { type: "message", data: msg("user", url) },
    { type: "wait", data: 400 },
    { type: "message", data: msg("director", "On it. I'm going to go through your entire site, read your reviews, then research your competitors. Watch the right panel.") },
    { type: "progress", data: { step: 1, state: "active" } },
    { type: "wait", data: 600 },
    { type: "stream", data: { id: "stream-product", items: productStreamItems, summary: "Product analysis complete — 6 modules, 2 unique differentiators" } as StreamBlockData },
    { type: "progress", data: { step: 1, state: "done" } },
    { type: "outputCard", data: { type: "product", data: mockProductData } as OutputCard },
    { type: "wait", data: 600 },
    { type: "message", data: msg("director", 'Product analysis done. Two things stand out: your <strong>Detection Rule Validation</strong> is unique — no competitor has it. And <strong>40% of reviewers mention your one-click mitigations</strong>. That\'s your moat.<br/><br/>Now let me check who you\'re up against.') },
    { type: "wait", data: 800 },
    { type: "progress", data: { step: 2, state: "active" } },
    { type: "stream", data: { id: "stream-competitors", items: competitorStreamItems, summary: "Competitive analysis complete — 2 major competitors analyzed" } as StreamBlockData },
    { type: "progress", data: { step: 2, state: "done" } },
    { type: "outputCard", data: { type: "competitive", data: mockCompetitiveData } as OutputCard },
    { type: "whatsNext", data: { icon: "✋", title: "Next: Your Input", desc: "The Director needs your feedback before moving to numbers." } },
    { type: "wait", data: 400 },
    { type: "message", data: msg("director", 'Competitive landscape is mapped.<br/><br/><strong>Pentera is your biggest threat</strong> — 3x your funding, 3x your ARR. But you have things they can\'t copy.<br/><br/>Before I go further — <strong>did I get anything wrong?</strong> Any competitors I missed? Modules you\'ve deprecated? Who do you actually lose deals to?') },
    { type: "progress", data: { step: 3, state: "active" } },
    { type: "enableInput", data: 1 },
  ];
}

export function getPhase1Sequence(feedback: string): SimulationStep[] {
  return [
    { type: "message", data: msg("user", feedback) },
    { type: "wait", data: 600 },
    { type: "message", data: msg("director", 'Good input. "Do nothing" being a top competitor changes the messaging strategy — it\'s not just about beating Pentera, it\'s about <strong>creating urgency</strong>.<br/><br/>Now I need your numbers to diagnose the bottleneck.<br/><br/><strong>Tell me:</strong><br/>• Monthly website traffic<br/>• Demos per month<br/>• What % qualify<br/>• How many close<br/>• ACV, current ARR, target ARR<br/>• Sales cycle length') },
    { type: "progress", data: { step: 3, state: "done" } },
    { type: "progress", data: { step: 4, state: "active" } },
    { type: "enableInput", data: 2 },
  ];
}

export function getPhase2Sequence(numbers: string): SimulationStep[] {
  return [
    { type: "message", data: msg("user", numbers) },
    { type: "wait", data: 600 },
    { type: "message", data: msg("director", "Let me run the math.") },
    { type: "wait", data: 400 },
    { type: "stream", data: { id: "stream-numbers", items: numbersStreamItems, summary: "Bottleneck diagnosed — positioning is the root cause" } as StreamBlockData },
    { type: "progress", data: { step: 4, state: "done" } },
    { type: "outputCard", data: { type: "funnel", data: mockFunnelData } as OutputCard },
    { type: "wait", data: 600 },
    { type: "message", data: msg("director", 'You need <strong>125 deals</strong>. Your funnel produces <strong>48</strong>. That\'s a $9.2M gap.<br/><br/>The fix: move website conversion from 0.09% → 0.18% and close rate from 15% → 22%. Result: <strong>$17.4M net-new ARR</strong> from the same traffic. Overshoots your target.<br/><br/>Both fixes come from one root cause: <strong>positioning</strong>. Let me build the plan.') },
    { type: "wait", data: 1200 },
    { type: "progress", data: { step: 5, state: "active" } },
    { type: "stream", data: { id: "stream-plan", items: workStatementStreamItems, summary: "Work Statement complete" } as StreamBlockData },
    { type: "progress", data: { step: 5, state: "done" } },
    { type: "outputCard", data: { type: "workStatement", data: mockWorkStatementData } as OutputCard },
    { type: "outputCard", data: { type: "paywall", data: mockPaywallData } as OutputCard },
    { type: "wait", data: 600 },
    { type: "message", data: msg("director", 'Your Work Statement is on the right — <strong>4 sprints, 8 agents, 42 deliverables.</strong><br/><br/>Sprint 1 front-loads positioning and SEO because that\'s your bottleneck. By Sprint 2 the new messaging goes live across campaigns, content, and outbound. By Sprint 4 we measure what moved.<br/><br/>The diagnosis is free. <strong>Ready to let the team execute it?</strong>') },
    { type: "enableInput", data: 3 },
  ];
}
