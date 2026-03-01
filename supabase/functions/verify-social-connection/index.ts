import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getAccounts } from "../_shared/late-api.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task_id, platform } = await req.json();

    if (!task_id || !platform) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing task_id or platform" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Load task
    const { data: task, error: taskErr } = await sb
      .from("sprint_tasks")
      .select("conversation_state, conversation_messages")
      .eq("id", task_id)
      .single();

    if (taskErr || !task) {
      return new Response(
        JSON.stringify({ success: false, error: `Task not found: ${taskErr?.message}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const state = (task.conversation_state as Record<string, any>) || {};
    const profileId = state.late_profile_id;

    if (!profileId) {
      return new Response(
        JSON.stringify({ success: false, error: "No Late profile found for this task" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check accounts via Late API
    const { accounts } = await getAccounts(profileId);
    const match = accounts.find(
      (a) => a.platform === platform && a.isActive
    );

    if (!match) {
      return new Response(
        JSON.stringify({ success: false, error: "Connection not found. Please try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Update conversation_state
    const connections = state.connections || {};
    connections[platform] = {
      status: "connected",
      account_id: match.accountId,
      display_name: match.displayName,
      connected_at: new Date().toISOString(),
    };

    const updatedState = { ...state, connections };

    // 4. Append a "connected" message
    const messages = Array.isArray(task.conversation_messages) ? task.conversation_messages : [];
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    const connectedMsg = {
      id: crypto.randomUUID(),
      role: "agent",
      timestamp: new Date().toISOString(),
      content: `✅ ${platformName} connected successfully as "${match.displayName}"!`,
      elements: [
        {
          type: "status_indicator",
          label: platformName,
          status: "connected",
          detail: match.displayName,
        },
      ],
    };

    await sb
      .from("sprint_tasks")
      .update({
        conversation_state: updatedState,
        conversation_messages: [...messages, connectedMsg],
        updated_at: new Date().toISOString(),
      })
      .eq("id", task_id);

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          accountId: match.accountId,
          platform: match.platform,
          displayName: match.displayName,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-social-connection error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
