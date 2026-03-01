// supabase/functions/run-sprint/index.ts
//
// The Puppeteer Director — orchestrates an entire sprint.
// 
// Called after payment. It:
// 1. Loads all queued tasks for the given sprint
// 2. Runs each agent one by one (sequential to avoid rate limits)
// 3. Updates task status as each completes
// 4. The dashboard polls sprint_tasks and updates in real-time
//

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, sprint_number = 1 } = await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    console.log(`[Puppeteer] Starting Sprint ${sprint_number} for session ${session_id}`);

    // Load all queued execution tasks for this sprint (skip interactive tasks)
    const { data: tasks, error } = await supabase
      .from("sprint_tasks")
      .select("*")
      .eq("session_id", session_id)
      .eq("sprint_number", sprint_number)
      .eq("status", "queued")
      .eq("task_type", "execution")
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to load tasks: ${error.message}`);
    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No queued tasks found", tasks_run: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Puppeteer] Found ${tasks.length} queued tasks`);

    // Get the base URL for calling the run-agent function
    const runAgentUrl = `${SUPABASE_URL}/functions/v1/run-agent`;
    const authHeader = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

    // Fire-and-forget: pick the first queued task, kick off run-agent
    // without awaiting the response. run-agent updates the DB directly.
    // The dashboard polls sprint_tasks for status changes.

    const task = tasks[0];
    console.log(`[Puppeteer] Firing agent for task: ${task.task_title} (${task.agent})`);

    // Mark task as running immediately
    await supabase
      .from("sprint_tasks")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", task.id);

    // Fire-and-forget: don't await the response
    fetch(runAgentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        task_id: task.id,
        session_id: session_id,
      }),
    }).catch((e) => {
      console.error(`[Puppeteer] Fire-and-forget fetch error (non-fatal): ${e.message}`);
    });

    // Return immediately — agent will update DB when done
    return new Response(
      JSON.stringify({ success: true, task_id: task.id, status: "running", remaining: tasks.length - 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[Puppeteer] Error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
