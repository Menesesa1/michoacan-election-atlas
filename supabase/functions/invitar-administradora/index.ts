import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { canInvite, validateInvitation } from "./validation.ts";

const APP_ORIGIN = "https://emedesarrolloelectoral.com";

Deno.serve(async (req) => {
  const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond(405, { error: "Método no permitido" });
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return respond(401, { error: "Inicia sesión" });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return respond(500, { error: "Servicio de invitaciones no disponible" });
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: identity, error: authError } = await admin.auth.getUser(authorization.slice(7));
    if (authError || !identity.user) return respond(401, { error: "Sesión no válida" });
    const { data: roles, error: rolesError } = await admin.from("user_roles")
      .select("role").eq("user_id", identity.user.id);
    if (rolesError || !canInvite(roles)) return respond(403, { error: "Solo administradores pueden invitar" });
    const email = validateInvitation(await req.json());
    if (!email) return respond(400, { error: "Correo no válido" });
    // generateLink creates an invited account without sending an email or opening signup.
    let result = await admin.auth.admin.generateLink({
      type: "invite", email, options: { redirectTo: `${APP_ORIGIN}/reset-password` },
    });
    let type = "invite";
    // Re-inviting a confirmed existing account should use its password recovery flow.
    if (result.error?.code === "email_exists") {
      type = "recovery";
      result = await admin.auth.admin.generateLink({
        type: "recovery", email, options: { redirectTo: `${APP_ORIGIN}/reset-password` },
      });
    }
    if (result.error || !result.data.user || !result.data.properties?.hashed_token) {
      return respond(400, { error: result.error?.message ?? "No se pudo crear la invitación" });
    }
    const { error: roleError } = await admin.from("user_roles").upsert({
      user_id: result.data.user.id, role: "admin",
    }, { onConflict: "user_id,role" });
    if (roleError) return respond(500, { error: "No se pudo asignar el rol de administradora" });
    const link = new URL(`${APP_ORIGIN}/reset-password`);
    link.hash = new URLSearchParams({ invitation_token: result.data.properties.hashed_token, type }).toString();
    return respond(200, { success: true, email, role: "admin", invitation_url: link.toString() });
  } catch {
    return respond(500, { error: "No se pudo completar la invitación" });
  }
});