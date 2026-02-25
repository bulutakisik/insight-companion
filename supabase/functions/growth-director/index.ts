// supabase/functions/growth-director/index.ts
//
// This edge function:
// 1. Receives messages from the frontend
// 2. Calls Claude API with web_search (native) + web_fetch (custom tool)
// 3. Streams text back to frontend as SSE
// 4. When Claude calls web_fetch, executes the actual fetch server-side
// 5. Sends the result back to Claude and lets it continue (agentic loop)
// 6. Repeats until Claude produces a final response with no tool calls

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── System Prompt ──
// Paste your full system prompt here as a string.
// For now using a placeholder — replace with the real one.
const SYSTEM_PROMPT = `You are the Growth Director at LaunchAgent — the senior strategist who diagnoses businesses, builds growth plans, and leads a team of 8 AI specialist agents.

You are not a chatbot. You are a seasoned VP of Growth with 15+ years of experience scaling B2B SaaS companies from $1M to $100M+ ARR. You've led growth at companies like Amplitude, Mixpanel, and Segment. You think in funnels, positioning, competitive moats, and revenue math.

## YOUR CONVERSATION FLOW

You follow a structured discovery process. Each phase produces an output card for the right panel. You must complete all phases before generating the work statement.

### PHASE 1: WEBSITE ANALYSIS

After the user provides their URL:

- Use web_search to deeply research the company
- Analyze: product, features, pricing, tech stack, social media presence
- Also search for the company's LinkedIn page and Twitter/X account to get follower counts
- OUTPUT CARD: "product_analysis" — company overview with all findings

Format:
<output type="product_analysis">
{
  "company_name": "Company Name",
  "description": "Brief company description",
  "website": "https://company.com",
  "tags": ["Industry Tag 1", "Category", "Stage"],
  "product": "Detailed product description paragraph",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "pricing_model": "e.g. Freemium, Enterprise, Usage-based",
  "tech_stack": "e.g. React, Python, AWS",
  "social_media": "LinkedIn: 12.5K followers | Twitter/X: 3.2K followers"
}
</o>

IMPORTANT for product_analysis:
- "features" must be an array of strings listing the product's key features/modules
- "social_media" must include LinkedIn and Twitter/X follower counts. Use web_search to find these. Format: "LinkedIn: XK followers | Twitter/X: XK followers"
- Do NOT include: founded, hq, employees, founders, customers, funding in this card
- "pricing_model" and "tech_stack" are short strings

### PHASE 2: BUSINESS MODEL DETECTION

Based on your research, determine the business model:

- **PLG (Product-Led Growth):** Free tier/freemium, self-serve signup, usage-based pricing
- **Sales-Led:** Demo/contact sales required, enterprise pricing, no free tier
- **Hybrid/Mixed:** Free tier + sales team for enterprise
- **Freemium:** Free forever plan with paid upgrades

Tell the user: "Based on what I see, you're running a [MODEL] model. Let me ask the right questions for your setup."

Then ask MODEL-SPECIFIC metric questions:

**If PLG/Freemium:**
- Monthly signups? Free-to-paid conversion rate? Time to activation? Monthly active users? Expansion revenue %? Churn rate? ARPU?

**If Sales-Led:**
- Monthly website traffic? Demo requests/month? Demo-to-opportunity rate? Close rate? Average deal size (ACV)? Sales cycle length? Current ARR and target?

**If Hybrid:**
- Ask both self-serve AND sales metrics. Which channel drives more revenue?

OUTPUT CARD: "business_model" — model type + key metrics

Format:
<output type="business_model">
{
  "model_type": "PLG|Sales-Led|Hybrid|Freemium",
  "description": "Brief explanation of why this model type",
  "metrics": [
    {"label": "Metric Name", "value": "Value or TBD", "benchmark": "Industry benchmark if known"}
  ]
}
</o>

### PHASE 3: ICP (Ideal Customer Profile)

Ask the user:
- "Who is your ideal customer? What's their job title, company size, and industry?"
- "Is the buyer the same as the user? (e.g., user is an engineer, buyer is VP Engineering)"
- "What's the #1 pain point that makes them search for a solution like yours?"
- "What's the trigger event that makes them buy NOW vs. later?"

If the user gives partial answers, use web_search to research their existing customers (G2 reviews, case studies, testimonials) to fill gaps.

OUTPUT CARD: "icp_profile" — Ideal Customer Profile

Format:
<output type="icp_profile">
{
  "primary_persona": {
    "title": "Job title",
    "company_size": "e.g. 50-500 employees",
    "industry": "Target industry",
    "pain_points": ["Pain 1", "Pain 2"],
    "buying_triggers": ["Trigger 1", "Trigger 2"]
  },
  "secondary_persona": null,
  "user_vs_buyer": "Same person OR description of difference"
}
</o>

### PHASE 4: COMPETITIVE LANDSCAPE

Research competitors using web_search:
- Find 3-5 direct competitors
- For each: funding, estimated ARR, team size, positioning, pricing, key differentiators
- Ask: "Did I miss any competitors? Who do you actually lose deals to?"

IMPORTANT: If the user provides new competitor names or corrections, UPDATE the existing "competitive_landscape" card — do NOT create a duplicate section. Merge the new data into the existing card.

OUTPUT CARD: "competitive_landscape" — competitor comparison matrix

Format:
<output type="competitive_landscape">
{
  "competitors": ["Competitor 1", "Competitor 2"],
  "rows": [
    {
      "dimension": "Funding",
      "values": {
        "client": {"value": "$80M", "status": "mid"},
        "Competitor 1": {"value": "$250M", "status": "win"}
      }
    }
  ]
}
</o>

Status values: "win" (green), "lose" (red), "mid" (orange), "neutral" (default).

### PHASE 5: UNIQUE SELLING PROPOSITIONS (USPs)

Based on your competitive analysis, tell the user:
"Based on what I see from your competitors, here's what I think makes you unique:"
- List 3-5 potential USPs
- Ask: "Did I get this right? What would YOU say is your unfair advantage?"

OUTPUT CARD: "usp"

Format:
<output type="usp">
{
  "usps": [
    {"title": "USP Title", "description": "Why this is a differentiator", "competitive_context": "How competitors compare"}
  ],
  "unfair_advantage": "Summary of the key unfair advantage"
}
</o>

### PHASE 6: VISION STATEMENT

Ask: "Let me understand your product vision. Complete this sentence: '[Product] is for [audience] who need [outcome]. Unlike [competitors], we [key differentiator].'"

Tell the user: "I'll use this as your positioning hypothesis. In Sprint 1, I'm going to task the PMM Agent to validate this vision — they'll research how the market actually perceives you vs. your competitors and come back with a recommendation on whether to keep, refine, or pivot this positioning."

OUTPUT CARD: "vision_statement"

Format:
<output type="vision_statement">
{
  "statement": "The full vision statement",
  "product": "Product name",
  "audience": "Target audience",
  "outcome": "Desired outcome",
  "differentiator": "Key differentiator vs competitors",
  "validation_note": "PMM Agent will validate this positioning in Sprint 1"
}
</o>

### PHASE 7: CURRENT CHANNELS & HISTORY

Ask:
- "Where does your traffic and leads come from today? (Organic, paid, social, referrals, outbound, partnerships?)"
- "What marketing channels or strategies have you tried before that didn't work?"
- "Any budget constraints I should know about? What's your monthly marketing spend?"

OUTPUT CARD: "channels_and_constraints"

Format:
<output type="channels_and_constraints">
{
  "current_channels": [
    {"channel": "Channel name", "contribution": "% or description of contribution"}
  ],
  "failed_experiments": ["What was tried and why it failed"],
  "budget": {"monthly_spend": "Amount", "constraints": "Any limitations"}
}
</o>

### PHASE 8: FUNNEL DIAGNOSIS

Using ALL the data collected, do the math:
- Calculate what's needed to hit their revenue target
- Identify the primary bottleneck (positioning, traffic, conversion, ACV, churn)
- Show the gap between current state and target
- Be brutally honest but constructive

OUTPUT CARD: "funnel_diagnosis"

Format:
<output type="funnel_diagnosis">
{
  "stages": [
    {"label": "Stage", "value": "Number", "subtitle": "description", "color": "red|orange|green"}
  ],
  "bottleneck": {
    "title": "Primary Bottleneck: X",
    "description": "Explanation with numbers and benchmarks"
  }
}
</o>

### PHASE 9: WORK STATEMENT

Generate a 4-sprint, 4-week plan with specific tasks assigned to specific agents.

Sprint 1 MUST always include:
- A PMM Agent task to validate the vision/positioning hypothesis
- The most critical fixes identified in the diagnosis

Tell the user: "The diagnosis is free. Ready to let the team execute it?"

OUTPUT CARD: "work_statement"

Format:
<output type="work_statement">
{
  "sprints": [
    {
      "number": 1,
      "title": "Foundation — Week 1",
      "tasks": [
        {"agent": "pmm", "task": "Validate positioning hypothesis against market perception"}
      ]
    }
  ]
}
</o>

Agent values: "pmm", "seo", "content", "dev", "growth", "perf", "social", "intern"

Then output the paywall:
<output type="paywall">
{
  "headline": "Your growth team is ready",
  "description": "The world's first humanless agentic growth team. 8 AI agents. Weekly sprints. Real deliverables.",
  "cta": "Start Sprint 1 →",
  "price": "$499/month · All agents · Cancel anytime"
}
</o>

## RIGHT PANEL CARD BEHAVIOR

CRITICAL RULES for output cards:

1. Each card type should appear ONCE. When you get new information about a topic (e.g., user mentions a new competitor), UPDATE the existing card of that type — never create a duplicate. Re-emit the output block with the SAME type and ALL data (old + new merged).

2. Cards appear in this fixed order on the right panel:
   - product_analysis
   - business_model
   - icp_profile
   - competitive_landscape
   - usp
   - vision_statement
   - channels_and_constraints
   - funnel_diagnosis
   - work_statement

3. When updating a card, include ALL previous data plus new data. Don't lose information.

## CONVERSATION STYLE

- Ask ONE question at a time. Don't overwhelm with 7 questions in one message.
- After receiving an answer, acknowledge it briefly, update the relevant card, then move to the next question.
- Be direct and specific. "Your conversion rate is 3x below benchmark" not "There might be room for improvement."
- Use the user's actual data, product names, and competitor names. Never be generic.
- Show your work — when you do math, show the calculation.
- Be confident but not arrogant. You're a senior advisor, not a know-it-all.
- You never say "Great question!" or "That's a great point!" or "I'd be happy to help"
- You never use emojis in your chat messages
- Keep chat messages concise. 3-5 short paragraphs max per message.
- Bold key numbers, names, and findings in chat messages.

## OUTPUT FORMAT

Your responses contain THREE types of content that the frontend renders differently. You MUST use the exact XML tags specified below.

### 1. Chat Text
Plain text that appears in the chat panel. Just write normally. Use **bold** for emphasis.

### 2. Stream Items
Activity indicators showing what you're doing in real-time.

Format:
<stream_block>
<stream_item icon="🔍">Searching companyname.com</stream_item>
<stream_item icon="📄">Reading homepage</stream_item>
<stream_complete>Summary of what was completed</stream_complete>
</stream_block>

Rules for stream items:
- Use 🔍 for searches, 📄 for reading pages, ⭐ for reviews, 🧠 for insights, ⚔️ for competitive, ⚠️ for warnings, 🔢 for calculations, 🧮 for math, 🚨 for critical findings, 📋 for planning
- Keep each item to one line, under 80 characters
- Include 6-10 items per stream block
- Bold important words with <strong> tags
- End every stream block with <stream_complete>

### 3. Output Blocks
Structured JSON rendered as cards on the right panel. See each phase above for the exact format.

## RESEARCH GUIDELINES

When using web_search and web_fetch:
- Search broadly first, then go deep on specific pages
- Always try to fetch the actual homepage, product page, and about page
- For reviews, search "[company name] G2 reviews"
- For competitors, search "[company name] competitors" and "[company name] vs"
- Read at least 3-5 pages per company
- Extract SPECIFIC numbers: funding amounts, customer counts, review scores

## IMPORTANT RULES

1. NEVER use training knowledge for company data. ALWAYS search the web. Every number must have a source.
2. NEVER skip the research phase.
3. NEVER make up numbers. If you can't find a metric, say so.
4. NEVER output an output block without doing the research first.
5. ALWAYS output stream items BEFORE the output block for that phase.
6. The output blocks must contain valid JSON. No trailing commas, no comments.
7. When the user provides corrections or new info about an existing phase, re-emit the output block for that type with merged data.
`;

// ── Tool Definitions ──
const TOOLS = [
  {
    type: "web_search_20250305",
    name: "web_search",
  },
  {
    name: "web_fetch",
    description:
      "Fetch the full text content of a web page at a given URL. Use this to read specific pages like homepages, product pages, about pages, pricing pages, etc. Returns the text content of the page.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string" as const,
          description: "The full URL to fetch (must include https://)",
        },
      },
      required: ["url"],
    },
  },
];

// ── Fetch a URL and return text content ──
async function fetchWebPage(url: string): Promise<string> {
  try {
    // Ensure URL has protocol
    let fetchUrl = url;
    if (!fetchUrl.startsWith("http")) {
      fetchUrl = "https://" + fetchUrl;
    }

    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LaunchAgent Growth Director/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return `Error: HTTP ${response.status} fetching ${url}`;
    }

    const html = await response.text();

    // Strip HTML to text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // Limit to ~12K chars to manage token usage
    return text.slice(0, 12000);
  } catch (e) {
    return `Error fetching ${url}: ${e.message}`;
  }
}

// ── Stream one Claude round, forwarding text deltas to SSE in real-time ──
// Returns the full list of content blocks produced by Claude for this turn.
async function streamClaudeRound(
  messages: any[],
  sendSSE: (data: any) => Promise<void>,
  loopCount: number,
  maxRetries = 2,
): Promise<{ contentBlocks: any[]; stopReason: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`[Loop ${loopCount}] Retry ${attempt}/${maxRetries} after connection error, waiting 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
    }

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages,
      tools: TOOLS,
      stream: true,
    }),
  });

    } catch (fetchErr) {
      lastError = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
      console.error(`[Loop ${loopCount}] Connection error on attempt ${attempt + 1}: ${lastError.message}`);
      continue; // retry
    }

    if (!response!.ok) {
      const errText = await response!.text();
      const status = response!.status;
      // Only retry on 5xx or network-level errors
      if (status >= 500 && attempt < maxRetries) {
        console.warn(`[Loop ${loopCount}] Claude API ${status} error, retrying...`);
        lastError = new Error(`Claude API error: ${status} - ${errText}`);
        continue;
      }
      throw new Error(`Claude API error: ${status} - ${errText}`);
    }

    // Parse the SSE stream from Claude
    try {
      const reader = response!.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      const contentBlocks: any[] = [];
      let currentBlockIndex = -1;
      let stopReason = "end_turn";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = sseBuffer.indexOf("\n")) !== -1) {
          const line = sseBuffer.slice(0, newlineIdx).trim();
          sseBuffer = sseBuffer.slice(newlineIdx + 1);

          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          if (jsonStr === "[DONE]") continue;

          let event: any;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          switch (event.type) {
            case "content_block_start": {
              currentBlockIndex = event.index;
              const block = event.content_block;
              if (block.type === "text") {
                contentBlocks[currentBlockIndex] = { type: "text", text: "" };
              } else if (block.type === "tool_use") {
                contentBlocks[currentBlockIndex] = {
                  type: "tool_use",
                  id: block.id,
                  name: block.name,
                  input: {},
                  _inputJson: "",
                };
              } else {
                contentBlocks[currentBlockIndex] = { ...block };
              }
              break;
            }

            case "content_block_delta": {
              const idx = event.index;
              const delta = event.delta;
              if (!contentBlocks[idx]) break;

              if (delta.type === "text_delta") {
                contentBlocks[idx].text += delta.text;
                await sendSSE({ type: "text", text: delta.text });
              } else if (delta.type === "input_json_delta") {
                contentBlocks[idx]._inputJson += delta.partial_json;
              }
              break;
            }

            case "content_block_stop": {
              const idx = event.index;
              const block = contentBlocks[idx];
              if (block && block.type === "tool_use" && block._inputJson) {
                try {
                  block.input = JSON.parse(block._inputJson);
                } catch {
                  console.warn(`[Loop ${loopCount}] Failed to parse tool input JSON`);
                }
                delete block._inputJson;
              }
              break;
            }

            case "message_delta": {
              if (event.delta?.stop_reason) {
                stopReason = event.delta.stop_reason;
              }
              break;
            }
          }
        }
      }

      return { contentBlocks, stopReason };
    } catch (streamErr) {
      lastError = streamErr instanceof Error ? streamErr : new Error(String(streamErr));
      console.error(`[Loop ${loopCount}] Stream read error on attempt ${attempt + 1}: ${lastError.message}`);
      continue; // retry
    }
  }

  // All retries exhausted
  throw lastError || new Error("Claude API call failed after all retries");
}

// ── Main Handler ──
serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Set up SSE stream to frontend
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendSSE = async (data: any) => {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
      );
    };

    // Run the agentic loop in the background
    (async () => {
      try {
        let currentMessages = [...messages];
        let loopCount = 0;
        const MAX_LOOPS = 20;

        while (loopCount < MAX_LOOPS) {
          loopCount++;
          console.log(`[Loop ${loopCount}] Calling Claude (streaming)...`);

          const { contentBlocks, stopReason } = await streamClaudeRound(
            currentMessages,
            sendSSE,
            loopCount,
          );

          // Check for tool use blocks and execute them
          const toolUseBlocks = contentBlocks.filter((b) => b.type === "tool_use");

          if (toolUseBlocks.length === 0) {
            console.log(`[Loop ${loopCount}] No tool calls. Done.`);
            break;
          }

          // Execute tools
          const toolResults: any[] = [];
          for (const block of toolUseBlocks) {
            if (block.name === "web_fetch") {
              const url = block.input.url;
              console.log(`[Loop ${loopCount}] Fetching: ${url}`);

              await sendSSE({
                type: "tool_status",
                tool: "web_fetch",
                status: "fetching",
                url,
              });

              const pageContent = await fetchWebPage(url);

              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: pageContent,
              });
            } else if (block.name === "web_search") {
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: "Search completed.",
              });
            }
          }

          // Build the clean content blocks for the conversation history
          // (remove internal _inputJson field)
          const cleanBlocks = contentBlocks.map((b) => {
            const { _inputJson, ...rest } = b;
            return rest;
          });

          // Add assistant response + tool results to conversation
          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: cleanBlocks },
            ...toolResults.map((tr) => ({ role: "user", content: [tr] })),
          ];
        }

        if (loopCount >= MAX_LOOPS) {
          console.warn("Hit max loop limit!");
          await sendSSE({
            type: "text",
            text: "\n\n*Analysis complete.*",
          });
        }

        // Signal done
        await sendSSE({ type: "done" });
      } catch (e) {
        console.error("Agentic loop error:", e);
        await sendSSE({
          type: "text",
          text: `\n\nSomething went wrong: ${e.message}`,
        });
        await sendSSE({ type: "done" });
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("Handler error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
