// Upload a file to Google Drive into folder hierarchy: ROOT / eleccion / periodo
// Uses connector gateway. Scope: drive.file (only files/folders created by this app).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const DRIVE_API = `${GATEWAY}/drive/v3`;
const UPLOAD_API = `${GATEWAY}/upload/drive/v3/files`;
const ROOT_NAME = "Analista Electoral Michoacán";

interface Body {
  filename: string;
  mime: string;
  base64: string;
  eleccion?: string | null;
  periodo?: string | null;
}

function headers() {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurado");
  if (!GOOGLE_DRIVE_API_KEY) throw new Error("GOOGLE_DRIVE_API_KEY no configurado");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
  };
}

async function findOrCreateFolder(name: string, parentId?: string): Promise<string> {
  const q = [
    `name = '${name.replace(/'/g, "\\'")}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
    parentId ? `'${parentId}' in parents` : `'root' in parents`,
  ].join(" and ");
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`;
  const r = await fetch(url, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(`Drive search ${r.status}: ${JSON.stringify(data)}`);
  if (data.files?.length) return data.files[0].id;

  // create
  const body: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) body.parents = [parentId];
  const cr = await fetch(`${DRIVE_API}/files?fields=id`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const cd = await cr.json();
  if (!cr.ok) throw new Error(`Drive create folder ${cr.status}: ${JSON.stringify(cd)}`);
  return cd.id;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    if (!body?.filename || !body?.base64 || !body?.mime) {
      return new Response(JSON.stringify({ error: "filename, mime y base64 requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // folder hierarchy
    const rootId = await findOrCreateFolder(ROOT_NAME);
    let parentId = rootId;
    if (body.eleccion) parentId = await findOrCreateFolder(body.eleccion, parentId);
    if (body.periodo) parentId = await findOrCreateFolder(body.periodo, parentId);

    // multipart upload
    const boundary = "----lovable-" + crypto.randomUUID();
    const meta = JSON.stringify({ name: body.filename, parents: [parentId] });
    const bytes = b64ToBytes(body.base64);

    const enc = new TextEncoder();
    const pre = enc.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
        `--${boundary}\r\nContent-Type: ${body.mime}\r\nContent-Transfer-Encoding: binary\r\n\r\n`,
    );
    const post = enc.encode(`\r\n--${boundary}--`);
    const payload = new Uint8Array(pre.length + bytes.length + post.length);
    payload.set(pre, 0);
    payload.set(bytes, pre.length);
    payload.set(post, pre.length + bytes.length);

    const up = await fetch(
      `${UPLOAD_API}?uploadType=multipart&fields=id,name,webViewLink,webContentLink`,
      {
        method: "POST",
        headers: {
          ...headers(),
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: payload,
      },
    );
    const ud = await up.json();
    if (!up.ok) throw new Error(`Drive upload ${up.status}: ${JSON.stringify(ud)}`);

    return new Response(
      JSON.stringify({
        success: true,
        id: ud.id,
        name: ud.name,
        webViewLink: ud.webViewLink,
        folderId: parentId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("gdrive-upload error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
