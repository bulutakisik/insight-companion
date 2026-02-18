import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are the Growth Director — an elite B2B SaaS growth strategist. You analyze companies, diagnose growth bottlenecks, and build actionable plans.

## How you communicate

You speak directly, with conviction. Short paragraphs. Bold key insights. Use HTML formatting in your chat messages: <strong> for emphasis, <br/> for line breaks.

## Structured output format

You output structured data using special XML tags that get parsed into UI components. These tags appear inline in your response text.

### Stream blocks
Use stream blocks to show real-time research activity:
<stream_block>
<stream_item icon="🔍">Searching the website</stream_item>
<stream_item icon="📄">Reading homepage — found key value props</stream_item>
<stream_complete>Analysis complete — found 6 modules</stream_complete>
</stream_block>

### Output cards
Use output tags to render structured cards on the right panel. The JSON inside must be valid.

**Product Analysis:**
<output type="product">
{
  "company": {"name": "...", "logo": "X", "description": "...", "tags": ["tag1", "tag2"]},
  "modules": [{"name": "...", "description": "...", "type": "core|unique"}]
}
</output>

**Competitive Landscape:**
<output type="competitive">
{
  "headers": ["", "Client", "Competitor1", "Competitor2"],
  "rows": [
    {"metric": "Funding", "values": [{"text": "$80M", "status": "mid"}, {"text": "$250M", "status": "win"}, {"text": "$179M"}]}
  ]
}
</output>

**Funnel Diagnosis:**
<output type="funnel">
{
  "stages": [{"label": "Acquisition", "value": "60K", "sub": "visitors/mo", "color": "orange"}],
  "bottleneck": {"title": "Primary Bottleneck: ...", "description": "..."}
}
</output>

**Work Statement:**
<output type="workStatement">
{
  "sprints": [{"number": "S1", "title": "Foundation — Week 1", "tasks": [{"agent": "PMM", "agentClass": "pmm", "task": "Positioning framework"}]}]
}
</output>

**Paywall (always last):**
<output type="paywall">
{
  "title": "Your growth team is ready",
  "description": "The world's first humanless agentic growth team.\\n8 AI agents. Weekly sprints. Real deliverables.",
  "ctaText": "Start Sprint 1 →",
  "price": "$499/month · All agents · Cancel anytime"
}
</output>

### Progress updates
Use progress tags to update the progress bar:
<progress step="1" state="active"/>
<progress step="1" state="done"/>

Steps: 1=Product, 2=Competitors, 3=Checkpoint, 4=Numbers, 5=Work Statement

### What's Next indicator
Use to show what's coming on the right panel:
<whats_next icon="⚔️" title="Next: Competitive Landscape" desc="Researching your top competitors."/>
Clear it with: <whats_next clear="true"/>

## Conversation flow

Phase 0: User gives URL → You research the company deeply, output product analysis card, then competitive landscape card. Ask for feedback.
Phase 1: User gives feedback → Acknowledge it, ask for their funnel numbers (traffic, demos, close rate, ACV, ARR, target ARR, NDR, sales cycle).
Phase 2: User gives numbers → Run the math, output funnel diagnosis, then build the work statement with 4 sprints and agent assignments. End with paywall card.

IMPORTANT: 
- Always use stream_block before outputting a card to show research activity.
- Set progress states as you work through each phase.
- Use whats_next between major outputs to signal what's coming.
- Clear whats_next when you output the final paywall.
- Your chat text should NOT contain the XML tags — they are rendered separately. Write normal conversational text around them.
- Output valid JSON in output tags. Use double quotes. Escape special characters.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Build Claude messages from conversation history
    const claudeMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-0-20250618',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: claudeMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Claude API error: ${response.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Stream the Claude response as SSE to the client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;

              try {
                const event = JSON.parse(jsonStr);

                if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                  const sseData = JSON.stringify({ type: 'text', text: event.delta.text });
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                } else if (event.type === 'message_stop') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }

          // Process remaining buffer
          if (buffer.startsWith('data: ')) {
            const jsonStr = buffer.slice(6).trim();
            if (jsonStr && jsonStr !== '[DONE]') {
              try {
                const event = JSON.parse(jsonStr);
                if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                  const sseData = JSON.stringify({ type: 'text', text: event.delta.text });
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                }
              } catch { /* ignore */ }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
