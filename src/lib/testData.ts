/**
 * Test mode data — used when ?test=true is in the URL.
 * Creates a session + sprint tasks in the database for developer testing.
 */

import { supabase } from "@/integrations/supabase/client";

const TEST_COMPANY_URL = "picussecurity.com";

const TEST_SOCIAL_INTERACTIVE_TASK = {
  agent: "Social Agent",
  title: "Connect Social Media Accounts",
  description: "Set up social media posting by connecting your accounts",
  task_type: "interactive" as const,
  conversation_scope: "account_setup",
  status: "waiting_for_input" as const,
  requires_user_input: true,
  conversation_state: {},
  conversation_messages: [
    {
      id: "welcome-" + Date.now(),
      role: "agent",
      timestamp: new Date().toISOString(),
      content:
        "Hey! I'm your Social Agent — I'll handle all your social media posting.\n\nBefore I can start, I need to connect to your accounts. This takes about 2 minutes.\n\nWhich platforms do you want me to post to?",
      elements: [
        {
          type: "checkbox_group",
          id: "platforms",
          label: "Select platforms",
          options: [
            { id: "linkedin", label: "LinkedIn", icon: "🔵" },
            { id: "twitter", label: "X (Twitter)", icon: "🐦" },
            { id: "instagram", label: "Instagram", icon: "📸" },
            { id: "facebook", label: "Facebook", icon: "👤" },
            { id: "tiktok", label: "TikTok", icon: "🎵" },
            { id: "youtube", label: "YouTube", icon: "▶️" },
            { id: "reddit", label: "Reddit", icon: "🟠" },
            { id: "pinterest", label: "Pinterest", icon: "📌" },
          ],
        },
      ],
    },
  ],
};

const TEST_TASKS: { agent: string; title: string; description: string }[] = [
  {
    agent: "PMM Agent",
    title: "Competitive Positioning Validation for Picus Security",
    description:
      "Validate Picus Security's positioning as the pioneer and leader in Breach & Attack Simulation. Research how Gartner, Forrester, G2, and PeerSpot analysts and users perceive Picus vs Cymulate, Pentera, SafeBreach, and AttackIQ. Analyze whether 'security validation platform' or 'BAS' resonates more with CISOs. Deliver a positioning validation report with competitive perception matrix.",
  },
  {
    agent: "SEO Agent",
    title: "BAS & Security Validation Keyword Research",
    description:
      "Conduct comprehensive keyword research for Picus Security targeting the BAS, security validation, and adversarial exposure validation space. Find high-intent keywords where CISOs and security leaders search for solutions. Analyze competitor SEO strategies for Cymulate and Pentera. Use DataForSEO. Deliver a keyword strategy report.",
  },
  {
    agent: "Dev Agent",
    title: "Technical SEO Audit of picussecurity.com",
    description:
      "Audit picussecurity.com's technical SEO foundation. Check meta tags, page speed, mobile responsiveness, structured data, sitemap, robots.txt, Core Web Vitals. Check both the main site and the insights/blog subdomain. Deliver a technical SEO audit.",
  },
  {
    agent: "Growth Agent",
    title: "Growth Lever Analysis for Enterprise BAS",
    description:
      "Analyze Picus Security's growth levers as a sales-led enterprise security company. Research how top BAS vendors (Cymulate, Pentera) acquire customers — analyst relations, events, channel partnerships, content marketing, outbound. Identify 3 specific growth experiments Picus should run to increase demo requests. Deliver a growth analysis with benchmarks from similar cybersecurity companies.",
  },
  {
    agent: "Content Agent",
    title: "Thought Leadership Blog: BAS Best Practices 2026",
    description:
      "Write a thought leadership blog post targeting 'breach and attack simulation best practices 2026' for Picus Security's blog. Position Picus as the authority in continuous security validation. Target CISOs and security directors. Deliver a publish-ready blog post.",
  },
  {
    agent: "Amplification Agent",
    title: "Directory Blitz + Community Discovery",
    description:
      "Submit Picus Security to the top 15 most relevant directories for a B2B cybersecurity/enterprise SaaS company. Generate tailored submission copy for each. Also find 10 Reddit and community threads where security professionals discuss BAS, security validation, or purple teaming and draft authentic replies. Deliver a submission playbook.",
  },
  {
    agent: "Social Agent",
    title: "2-Week Social Content Calendar",
    description:
      "Create a 2-week social media content calendar for Picus Security's Twitter/X and LinkedIn. Focus on thought leadership around emerging threats, MITRE ATT&CK coverage, and security validation insights. Target CISOs and security team leaders. Deliver a content calendar.",
  },
  {
    agent: "Perf Agent",
    title: "Performance Audit of picussecurity.com",
    description:
      "Run a performance audit on picussecurity.com. Test page load speed, Core Web Vitals, mobile performance on the main site and the insights blog. Identify the top 5 performance bottlenecks. Deliver a performance report.",
  },
];

const TEST_OUTPUT_CARDS = [
  {
    type: "product_analysis",
    data: {
      product: "Picus Security",
      url: TEST_COMPANY_URL,
      oneLiner: "The pioneer of Breach & Attack Simulation (BAS). The Picus Security Validation Platform helps organizations continuously validate security controls, identify exploitable vulnerabilities, and optimize defenses against real-world threats.",
    },
  },
  {
    type: "icp_profile",
    data: {
      title: "Ideal Customer Profile",
      segments: [
        { role: "CISOs", detail: "Decision-makers for security validation investment" },
        { role: "Security Directors", detail: "Oversee SOC operations and tooling" },
        { role: "SOC Managers", detail: "Day-to-day security operations leadership" },
        { role: "Security Architects", detail: "Design and implement security frameworks" },
      ],
      company: "Mid-to-large enterprises (500+ employees) in regulated industries (banking, finance, government, healthcare, energy)",
    },
  },
  {
    type: "competitive",
    data: {
      competitors: ["Cymulate", "Pentera", "SafeBreach", "AttackIQ", "XM Cyber"],
    },
  },
  {
    type: "business_model",
    data: {
      model: "Sales-Led / Enterprise SaaS",
      detail: "Demo required, annual contracts. Custom enterprise pricing with modular licensing: Security Control Validation, Attack Path Validation, Cloud Security Validation, Detection Rule Validation.",
    },
  },
];

/**
 * Bootstraps a test session with pre-built sprint tasks.
 * Returns the session ID to navigate to.
 */
export async function bootstrapTestSession(): Promise<string> {
  // Create session
  const { data: session, error: sessionErr } = await supabase
    .from("growth_sessions")
    .insert({
      company_url: TEST_COMPANY_URL,
      paid: true,
      current_phase: 99,
      output_cards: TEST_OUTPUT_CARDS as any,
      chat_items: [] as any,
      conversation_history: [] as any,
    })
    .select("id")
    .single();

  if (sessionErr || !session) throw new Error(`Failed to create test session: ${sessionErr?.message}`);

  // Create sprint tasks (execution tasks)
  const taskRows = TEST_TASKS.map((t) => ({
    session_id: session.id,
    sprint_number: 1,
    agent: t.agent,
    task_title: t.title,
    task_description: t.description,
    task_type: "execution",
    status: "queued",
    agent_brief: { task: t.title, description: t.description } as any,
  }));

  // Add interactive Social Agent setup task
  const socialTask = {
    session_id: session.id,
    sprint_number: 1,
    agent: TEST_SOCIAL_INTERACTIVE_TASK.agent,
    task_title: TEST_SOCIAL_INTERACTIVE_TASK.title,
    task_description: TEST_SOCIAL_INTERACTIVE_TASK.description,
    task_type: TEST_SOCIAL_INTERACTIVE_TASK.task_type,
    conversation_scope: TEST_SOCIAL_INTERACTIVE_TASK.conversation_scope,
    status: TEST_SOCIAL_INTERACTIVE_TASK.status,
    requires_user_input: TEST_SOCIAL_INTERACTIVE_TASK.requires_user_input,
    conversation_state: TEST_SOCIAL_INTERACTIVE_TASK.conversation_state as any,
    conversation_messages: TEST_SOCIAL_INTERACTIVE_TASK.conversation_messages as any,
  };

  const { error: taskErr } = await supabase.from("sprint_tasks").insert([...taskRows, socialTask]);
  if (taskErr) throw new Error(`Failed to create test tasks: ${taskErr.message}`);

  return session.id;
}
