import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createProfile, getConnectUrl, getRedirectUrl } from "../_shared/late-api.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ─── helpers ─── */

function uuid() {
  return crypto.randomUUID();
}

function extractCompanyInfo(outputCards: any[]): {
  company_name: string;
  website: string;
  industry: string;
  icp: string;
  positioning: string;
} {
  const info = {
    company_name: "Unknown",
    website: "Unknown",
    industry: "Unknown",
    icp: "Unknown",
    positioning: "Unknown",
  };

  for (const card of outputCards || []) {
    const d = card?.data;
    if (!d) continue;

    if (card.type === "product_analysis") {
      if (d.product) info.company_name = d.product;
      if (d.url) info.website = d.url;
      if (d.industry) info.industry = d.industry;
      if (d.oneLiner) info.positioning = d.oneLiner;
    }
    if (card.type === "icp_profile") {
      const segments = (d.segments || []).map((s: any) => s.role).join(", ");
      const company = d.company || "";
      info.icp = [segments, company].filter(Boolean).join(" at ");
    }
  }

  return info;
}

/* ─── prompt selection ─── */

function getSystemPrompt(
  agent: string,
  scope: string,
  state: any,
  companyInfo: ReturnType<typeof extractCompanyInfo>
): string {
  const key = `${agent}::${scope}`;

  switch (key) {
    case "Social Agent::account_setup":
      return buildSocialSetupPrompt(state, companyInfo);
    default:
      return `You are the ${agent} for ${companyInfo.company_name}. You need the user's input to proceed. Ask clearly what you need.

RESPONSE FORMAT:
You MUST respond with a valid JSON object and nothing else. No markdown, no explanation, just the JSON:
{
  "content": "Your message text",
  "elements": [],
  "state_updates": {},
  "conversation_complete": false
}`;
  }
}

function buildSocialSetupPrompt(
  state: any,
  info: ReturnType<typeof extractCompanyInfo>
): string {
  return `You are the Social Agent for ${info.company_name}. You're having a conversation with the user to connect their social media accounts so you can post on their behalf.

COMPANY CONTEXT:
- Company: ${info.company_name} (${info.website})
- Industry: ${info.industry}
- ICP: ${info.icp}
- Positioning: ${info.positioning}

CURRENT CONVERSATION STATE:
${JSON.stringify(state)}

YOUR JOB:
Guide the user step-by-step through connecting their social media accounts. The flow is:

1. PLATFORMS — Ask which platforms they want (if not yet selected). Options: LinkedIn, X (Twitter), Instagram, Facebook, TikTok, YouTube, Reddit, Pinterest.

2. POSTING MODE — Ask how they want posts handled:
   - "direct" = fully automated, you post on their behalf
   - "draft_approve" = you draft posts, they review and approve before publishing
   - "draft_only" = you prepare posts, they copy and publish themselves

3. PER PLATFORM — For each selected platform, one at a time:
   a. Ask if they have a Company/Business Page (for LinkedIn, Facebook) or if they want to use a personal profile
   b. If they don't have a page: give them step-by-step instructions to create one, pre-filled with company info from the context above. Then show a confirm_button for them to click when done.
   c. Generate an OAuth connection link. Use a link_button with url set to "GENERATE_OAUTH:{platform_id}" (e.g., "GENERATE_OAUTH:linkedin", "GENERATE_OAUTH:twitter"). The system will automatically replace this with a real OAuth URL.
   d. After showing the link, show a status_indicator with status "pending". Ask them to click the link, authorize in the new tab, and come back to confirm.
   e. Once they confirm, show the status as "connected" and move to the next platform.

4. COMPLETE — When all platforms are connected, show a summary info_card with all connections and their status. Set conversation_complete to true.

Platform IDs for GENERATE_OAUTH URLs:
- LinkedIn → linkedin
- X (Twitter) → twitter
- Instagram → instagram
- Facebook → facebook
- TikTok → tiktok
- YouTube → youtube
- Reddit → reddit
- Pinterest → pinterest

RESPONSE FORMAT:
You MUST respond with a valid JSON object and nothing else. No markdown, no explanation, just the JSON:
{
  "content": "Your conversational message to the user. Be friendly, brief, helpful. One step at a time.",
  "elements": [
    // Array of interactive elements to render. Use these types:
    // checkbox_group: { type: "checkbox_group", id: "unique_id", label: "Label", options: [{ id: "opt_id", label: "Label", icon: "emoji" }] }
    // radio_group: { type: "radio_group", id: "unique_id", label: "Label", options: [{ id: "opt_id", label: "Label", description: "Optional desc" }] }
    // link_button: { type: "link_button", id: "unique_id", label: "Button text", url: "GENERATE_OAUTH:platform_id", style: "primary" }
    // confirm_button: { type: "confirm_button", id: "unique_id", label: "Button text", style: "primary" }
    // status_indicator: { type: "status_indicator", label: "Platform", status: "pending|connected|failed", detail: "optional detail" }
    // info_card: { type: "info_card", title: "Title", fields: [{ label: "Label", value: "Value" }] }
    // Use an empty array [] if no interactive elements needed for this message.
  ],
  "state_updates": {
    // Any updates to merge into conversation_state. For example:
    // "platforms": ["linkedin", "twitter"]  — after platform selection
    // "posting_mode": "direct"  — after mode selection
    // "connections": { "linkedin": { "status": "pending" } }  — during connection flow
  },
  "conversation_complete": false
}

RULES:
- ONE question/step at a time. Never ask multiple things in one message.
- Use interactive elements (checkboxes, radio buttons, buttons) instead of asking users to type whenever possible.
- Be conversational and warm, not robotic. You're a team member, not a form.
- Pre-fill information from the company context when guiding page creation.
- Keep messages short — 2-3 sentences max per message.
- When the flow is done, set conversation_complete to true in your final message.
- The elements array must always be present (use [] if empty).
- The state_updates object must always be present (use {} if no updates).`;
}

/* ─── parse Claude JSON response ─── */

function parseAgentResponse(text: string): {
  content: string;
  elements: any[];
  state_updates: Record<string, any>;
  conversation_complete: boolean;
} {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      content: parsed.content || cleaned,
      elements: Array.isArray(parsed.elements) ? parsed.elements : [],
      state_updates:
        typeof parsed.state_updates === "object" && parsed.state_updates !== null
          ? parsed.state_updates
          : {},
      conversation_complete: !!parsed.conversation_complete,
    };
  } catch {
    return {
      content: text,
      elements: [],
      state_updates: {},
      conversation_complete: false,
    };
  }
}

/* ─── Late API OAuth URL post-processing ─── */

async function replaceOAuthPlaceholders(
  elements: any[],
  conversationState: Record<string, any>,
  companyName: string,
  taskId: string
): Promise<{ elements: any[]; stateUpdates: Record<string, any> }> {
  const stateUpdates: Record<string, any> = {};

  for (const element of elements) {
    if (
      element.type === "link_button" &&
      typeof element.url === "string" &&
      element.url.startsWith("GENERATE_OAUTH:")
    ) {
      const platform = element.url.replace("GENERATE_OAUTH:", "").toLowerCase();

      try {
        // Ensure we have a Late profile
        let profileId = conversationState.late_profile_id;
        if (!profileId) {
          console.log(`Creating Late profile for ${companyName}`);
          const profile = await createProfile(`${companyName} - Social`, `Social posting for ${companyName}`);
          profileId = profile.profileId;
          stateUpdates.late_profile_id = profileId;
          // Also update in-memory so subsequent elements in same response reuse it
          conversationState.late_profile_id = profileId;
        }

        // Build redirect URL with task context
        const baseRedirect = getRedirectUrl();
        const redirectUrl = `${baseRedirect}?task_id=${taskId}&platform=${platform}`;

        console.log(`Getting OAuth URL for ${platform}, profile ${profileId}`);
        const connectResult = await getConnectUrl(platform, profileId, redirectUrl);
        element.url = connectResult.authUrl;
        console.log(`OAuth URL generated for ${platform}`);
      } catch (err) {
        console.error(`Failed to generate OAuth URL for ${platform}:`, err);
        // Keep a fallback URL so the button isn't broken
        element.url = `https://placeholder.oauth.url/${platform}?error=api_failed`;
      }
    }
  }

  return { elements, stateUpdates };
}

/* ─── main handler ─── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task_id, session_id, user_message } = await req.json();

    if (!task_id || !session_id || !user_message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing task_id, session_id, or user_message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const sb = createClient(supabaseUrl, supabaseKey);

    // 1. Load task
    const { data: task, error: taskErr } = await sb
      .from("sprint_tasks")
      .select("conversation_scope, conversation_state, conversation_messages, agent")
      .eq("id", task_id)
      .single();

    if (taskErr || !task) {
      return new Response(
        JSON.stringify({ success: false, error: `Task not found: ${taskErr?.message}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Load session context
    const { data: session } = await sb
      .from("growth_sessions")
      .select("output_cards")
      .eq("id", session_id)
      .single();

    const outputCards = (session?.output_cards as any[]) || [];
    const companyInfo = extractCompanyInfo(outputCards);

    // 3. Append user message
    const existingMessages = Array.isArray(task.conversation_messages)
      ? task.conversation_messages
      : [];

    const userMsg = {
      id: uuid(),
      role: "user",
      timestamp: new Date().toISOString(),
      content: user_message.content || "",
      element_responses: user_message.element_responses || [],
    };

    const updatedMessages = [...existingMessages, userMsg];

    // 4. Build system prompt
    const conversationState =
      typeof task.conversation_state === "object" && task.conversation_state !== null
        ? task.conversation_state
        : {};
    const systemPrompt = getSystemPrompt(
      task.agent,
      task.conversation_scope || "",
      conversationState,
      companyInfo
    );

    // 5. Format messages for Claude
    const claudeMessages = updatedMessages.map((m: any) => {
      if (m.role === "agent" || m.role === "assistant") {
        return { role: "assistant" as const, content: m.content || "" };
      }
      let content = m.content || "";
      if (m.element_responses?.length) {
        const summary = m.element_responses
          .map((r: any) => `[${r.element_id}: ${JSON.stringify(r.value)}]`)
          .join(" ");
        content += `\n\nUser selections: ${summary}`;
      }
      return { role: "user" as const, content };
    });

    // 6. Call LLM — prefer Lovable AI Gateway, fallback to Anthropic
    let assistantText: string;

    if (lovableApiKey) {
      console.log("[agent-conversation] Using Lovable AI Gateway");
      const gatewayRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...claudeMessages,
          ],
          max_tokens: 2000,
        }),
      });

      if (!gatewayRes.ok) {
        const errText = await gatewayRes.text();
        console.error("Lovable AI Gateway error:", errText);
        return new Response(
          JSON.stringify({ success: false, error: `AI Gateway error: ${gatewayRes.status}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const gatewayData = await gatewayRes.json();
      assistantText = gatewayData.choices?.[0]?.message?.content || "I couldn't generate a response.";
    } else if (anthropicKey) {
      console.log("[agent-conversation] Using Anthropic API");
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 2000,
          system: systemPrompt,
          messages: claudeMessages,
        }),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        console.error("Anthropic error:", errText);
        return new Response(
          JSON.stringify({ success: false, error: `Claude API error: ${anthropicRes.status}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const anthropicData = await anthropicRes.json();
      assistantText = anthropicData.content?.[0]?.text || "I couldn't generate a response.";
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "No AI API key configured (LOVABLE_API_KEY or ANTHROPIC_API_KEY)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Parse response
    const parsed = parseAgentResponse(assistantText);

    // 8. Post-process: replace GENERATE_OAUTH: placeholders with real Late API URLs
    const oauthResult = await replaceOAuthPlaceholders(
      parsed.elements,
      conversationState,
      companyInfo.company_name,
      task_id
    );
    parsed.elements = oauthResult.elements;
    // Merge any Late-related state updates (like late_profile_id)
    Object.assign(parsed.state_updates, oauthResult.stateUpdates);

    // 9. Build agent message & update task
    const agentMsg = {
      id: uuid(),
      role: "agent",
      timestamp: new Date().toISOString(),
      content: parsed.content,
      elements: parsed.elements,
    };

    const finalMessages = [...updatedMessages, agentMsg];
    const mergedState = { ...conversationState, ...parsed.state_updates };

    const updatePayload: Record<string, any> = {
      conversation_messages: finalMessages,
      conversation_state: mergedState,
      updated_at: new Date().toISOString(),
    };

    if (parsed.conversation_complete) {
      updatePayload.status = "completed";
      updatePayload.requires_user_input = false;
      updatePayload.completed_at = new Date().toISOString();
    } else {
      updatePayload.status = "waiting_for_input";
      updatePayload.requires_user_input = true;
    }

    await sb.from("sprint_tasks").update(updatePayload).eq("id", task_id);

    // 10. Return response
    return new Response(
      JSON.stringify({
        success: true,
        agent_message: agentMsg,
        conversation_complete: parsed.conversation_complete,
        updated_state: mergedState,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("agent-conversation error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
