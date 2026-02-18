import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, sessionId } = await req.json();

    // TODO: Add Claude API call here
    // const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
    // 
    // The edge function should:
    // 1. Accept a message + conversation history
    // 2. Call Claude API with streaming enabled
    // 3. Parse tool_use events for structured output (cards)
    // 4. Stream responses back to the client
    //
    // For now, return a placeholder response

    const responseBody = JSON.stringify({
      success: true,
      message: "Edge function stub — Claude API integration pending",
      sessionId,
      receivedMessage: message,
      historyLength: conversationHistory?.length || 0,
    });

    return new Response(responseBody, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
