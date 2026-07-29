import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, huntId, hostId, memberId, teamId, newName } = body;

    if (!action || !huntId || !hostId) {
      return new Response(
        JSON.stringify({ error: "Missing action, huntId, or hostId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller is the host of this hunt
    const { data: hunt, error: huntErr } = await supabase
      .from("hunts")
      .select("id, host_id")
      .eq("id", huntId)
      .maybeSingle();

    if (huntErr || !hunt) {
      return new Response(
        JSON.stringify({ error: "Hunt not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (hunt.host_id !== hostId) {
      return new Response(
        JSON.stringify({ error: "Not authorized — you are not the host" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "remove_member" && memberId) {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);
      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to remove member" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "rename_team" && teamId && newName) {
      const { error } = await supabase
        .from("teams")
        .update({ name: newName })
        .eq("id", teamId);
      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to rename team" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "rename_member" && memberId && newName) {
      const { error } = await supabase
        .from("team_members")
        .update({ display_name: newName })
        .eq("id", memberId);
      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to rename member" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "remove_team" && teamId) {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);
      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to remove team" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
