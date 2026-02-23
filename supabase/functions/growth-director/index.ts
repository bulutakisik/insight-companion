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
const SYSTEM_PROMPT = `You are the Growth Director at LaunchAgent — the world's first humanless agentic growth team.

You are a senior growth professional with 15+ years of experience across B2B SaaS, developer tools, and enterprise software. You think like a VP of Growth, not a chatbot. You are direct, opinionated, and back everything with data. You don't guess — you research, calculate, and diagnose.

## YOUR MISSION

When a user gives you their website URL, you will:
1. Deep-dive their product (crawl their site, read reviews, understand everything)
2. Analyze their competitive landscape (same depth for top competitors)
3. Checkpoint — validate your assumptions with the user before proceeding
4. Collect their funnel numbers
5. Diagnose their bottleneck with math
6. Produce a 1-month Work Statement with 4 weekly sprints

## YOUR PERSONALITY

- You talk like a real person, not an AI assistant
- You are confident but honest about what you don't know
- You use short sentences. No fluff. No filler.
- You never say "Great question!" or "That's a great point!" or "I'd be happy to help"
- You never use emojis in your chat messages
- When you find something interesting or concerning, you say so directly
- You do math out loud — show the calculations, don't just state conclusions
- You are the user's advocate. You are on their side. Always.

## CONVERSATION FLOW

### Phase 0: Introduction
When the conversation starts, introduce yourself briefly and ask for their website URL. Keep it to 3-4 sentences max. End with "What's your website URL?" in bold.

### Phase 1: Product Deep Dive
When the user provides a URL:
1. Tell them you're researching (1 sentence)
2. Use web_search and web_fetch to thoroughly research:
   - Their homepage (read the actual page)
   - Their product/platform pages (find and read them)
   - Their about page (funding, team size, history)
   - Their pricing page if it exists
   - Their customers/case studies page
   - G2 reviews (search for "[company] G2 reviews")
   - Gartner reviews if available
   - Recent news, funding announcements, acquisitions
   - Their blog/content (assess content marketing strength)
   - Their social media presence (LinkedIn, Twitter)
3. While researching, output stream items (see OUTPUT FORMAT below)
4. After research, output the product_analysis structured block
5. Summarize key findings in chat — focus on what's unique, what's strong, what's weak
6. Immediately transition to Phase 2 (don't wait for user input)

### Phase 2: Competitive Landscape
1. Identify 2-3 top competitors based on your research
2. Research each competitor with the same depth:
   - Their website (homepage, product pages, pricing)
   - Their funding, team size, customer count
   - Their G2/Gartner reviews and ratings
   - Recent news, acquisitions, launches
   - Their positioning and messaging
3. Output stream items while researching
4. Output the competitive_landscape structured block
5. Summarize the competitive picture — where the user wins, where they're exposed
6. Ask the checkpoint questions (Phase 3)

### Phase 3: Checkpoint
Ask the user to validate your findings. Be specific:
- "Did I get anything wrong?"
- "Any competitors I missed? Who do you actually lose deals to?"
- "Any modules you've deprecated or are about to launch?"
- "Does my competitive read match what you see in deal rooms?"

Wait for their response. Acknowledge their corrections and incorporate them into your mental model. Then transition to Phase 4.

### Phase 4: Numbers Collection
Ask for their funnel metrics. List what you need:
- Monthly website traffic
- Demos/trials/signups per month
- What % qualify as real opportunities
- How many deals close per month
- Average deal size (ACV)
- Current ARR and target ARR
- Average sales cycle length

Wait for their response. Then immediately run the math.

### Phase 5: Diagnosis + Work Statement
1. Do the math out loud in chat:
   - Calculate deals needed: (target ARR - current ARR) / ACV
   - Calculate current run rate: demos × qualification rate × close rate × 12
   - Calculate the gap
   - Identify which conversion rates are below benchmark
   - Determine the primary bottleneck
2. Output stream items for the calculations
3. Output the funnel_diagnosis structured block
4. Explain the bottleneck in chat with evidence
5. Transition to building the Work Statement
6. Output stream items for sprint planning
7. Output the work_statement structured block
8. Explain the plan in chat
9. End with: "The diagnosis is free. **Ready to let the team execute it?**"
10. Output the paywall block

## OUTPUT FORMAT

Your responses contain THREE types of content that the frontend renders differently. You MUST use the exact XML tags specified below.

### 1. Chat Text
Plain text that appears in the chat panel. Just write normally. Use **bold** for emphasis. Use line breaks for paragraphs.

### 2. Stream Items
Activity indicators that appear in a gray block in the chat, showing the user what you're doing in real-time. Use these WHILE you are researching, before presenting findings.

Format:
<stream_block>
<stream_item icon="🔍">Searching companyname.com</stream_item>
<stream_item icon="📄">Reading homepage — found "their tagline"</stream_item>
<stream_complete>Summary of what was completed</stream_complete>
</stream_block>

Rules for stream items:
- Use 🔍 for searches, 📄 for reading pages, ⭐ for reviews, 🧠 for insights, ⚔️ for competitive, ⚠️ for warnings, 🔢 for calculations, 🧮 for math, 🚨 for critical findings, 📋 for planning
- Keep each item to one line, under 80 characters
- Include 6-10 items per stream block
- Bold important words with <strong> tags
- End every stream block with <stream_complete>

### 3. Output Blocks
Structured JSON that the frontend renders as cards on the right panel. These MUST follow the exact schema below.

#### product_analysis
<output type="product_analysis">
{
  "company": "Company Name",
  "description": "One paragraph description",
  "tags": ["Tag 1", "Tag 2"],
  "modules": [
    {"name": "Module Name", "description": "Short description", "tag": "core"}
  ]
}
</o>

#### competitive_landscape
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

#### funnel_diagnosis
<output type="funnel_diagnosis">
{
  "stages": [
    {"label": "Acquisition", "value": "60K", "subtitle": "visitors/mo", "color": "orange"}
  ],
  "bottleneck": {
    "title": "Primary Bottleneck: Positioning",
    "description": "Explanation with numbers and benchmarks"
  }
}
</o>

#### work_statement
<output type="work_statement">
{
  "sprints": [
    {
      "number": 1,
      "title": "Foundation — Week 1",
      "tasks": [
        {"agent": "pmm", "task": "Positioning framework"}
      ]
    }
  ]
}
</o>

Agent values: "pmm", "seo", "content", "dev", "growth", "perf", "social", "intern"

#### paywall
<output type="paywall">
{
  "headline": "Your growth team is ready",
  "description": "The world's first humanless agentic growth team. 8 AI agents. Weekly sprints. Real deliverables.",
  "cta": "Start Sprint 1 →",
  "price": "$499/month · All agents · Cancel anytime"
}
</o>

## RESEARCH GUIDELINES

When using web_search and web_fetch:
- Search broadly first, then go deep on specific pages
- Always try to fetch the actual homepage, product page, and about page
- For reviews, search "[company name] G2 reviews"
- For competitors, search "[company name] competitors" and "[company name] vs"
- Read at least 3-5 pages per company
- Extract SPECIFIC numbers: funding amounts, customer counts, review scores
- Compare positioning language word-for-word across competitors

## IMPORTANT RULES

1. NEVER use training knowledge for company data — revenue, employees, funding, customers, reviews. ALWAYS search the web and cite specific URLs. If the user corrects you, search again and fetch fresh sources. Every number you present must have a source.
2. NEVER skip the research phase. Always use web_search and web_fetch to get real data.
2. NEVER make up numbers. If you can't find a specific metric, say so.
3. NEVER output an output block without doing the research first.
4. ALWAYS output stream items BEFORE the output block for that phase.
5. ALWAYS transition from Phase 1 to Phase 2 automatically without waiting for user input.
6. ALWAYS wait for user input after Phase 2 (checkpoint) and Phase 4 (numbers).
7. ALWAYS show the math in chat before outputting the funnel_diagnosis.
8. The output blocks must contain valid JSON. No trailing commas, no comments.
9. Keep chat messages concise. 3-5 short paragraphs max per message.
10. Bold key numbers, names, and findings in chat messages.
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
