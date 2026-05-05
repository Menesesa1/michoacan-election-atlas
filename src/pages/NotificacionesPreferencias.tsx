import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell } from "lucide-react";

interface Pref {
  alertas_crisis: boolean;
  alertas_crisis_min_severidad: string;
  cib: boolean;
  cib_min_severidad: string;
  runs: boolean;
  runs_solo_errores: boolean;
  salud_municipio: boolean;
}

const DEFAULT: Pref = {
  alertas_crisis: true,
  alertas_crisis_min_severidad: "preventiva",
  cib: true,
  cib_min_severidad: "media",
  runs: false,
  runs_solo_errores: true,
  salud_municipio: true,
};

export default function NotificacionesPreferencias() {
  const [pref, setPref] = useState<Pref>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("notificacion_preferencias")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (data) setPref(data as any);
      setLoading(false);
    })();
  }, []);

  const guardar = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("notificacion_preferencias")
      .upsert({ user_id: u.user.id, ...pref });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Preferencias guardadas");
  };

  if (loading) return <div className="p-8 text-muted-foreground">Cargando…</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            Elige qué eventos quieres recibir en la campanita y como toast.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🚨 Alertas de crisis</CardTitle>
          <CardDescription>Notificaciones del monitor de crisis (Inteligencia)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Recibir alertas de crisis</Label>
            <Switch
              checked={pref.alertas_crisis}
              onCheckedChange={(v) => setPref({ ...pref, alertas_crisis: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Severidad mínima</Label>
            <Select
              value={pref.alertas_crisis_min_severidad}
              onValueChange={(v) => setPref({ ...pref, alertas_crisis_min_severidad: v })}
              disabled={!pref.alertas_crisis}
            >
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="informativa">Informativa (todas)</SelectItem>
                <SelectItem value="preventiva">Preventiva o más</SelectItem>
                <SelectItem value="urgente">Solo urgentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🕸️ Patrones CIB</CardTitle>
          <CardDescription>Coordinated Inauthentic Behavior detectado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Recibir alertas CIB</Label>
            <Switch checked={pref.cib} onCheckedChange={(v) => setPref({ ...pref, cib: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Severidad mínima</Label>
            <Select
              value={pref.cib_min_severidad}
              onValueChange={(v) => setPref({ ...pref, cib_min_severidad: v })}
              disabled={!pref.cib}
            >
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baja">Baja o más</SelectItem>
                <SelectItem value="media">Media o más</SelectItem>
                <SelectItem value="alta">Solo alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚙️ Ingestas y runs</CardTitle>
          <CardDescription>Trends, social, alertas, históricos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Notificar runs terminados</Label>
            <Switch checked={pref.runs} onCheckedChange={(v) => setPref({ ...pref, runs: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Solo cuando hay error</Label>
            <Switch
              checked={pref.runs_solo_errores}
              onCheckedChange={(v) => setPref({ ...pref, runs_solo_errores: v })}
              disabled={!pref.runs}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📍 Salud democrática municipal</CardTitle>
          <CardDescription>Cambios de estado verde→ámbar→rojo en municipios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Notificar cambios de estado</Label>
            <Switch
              checked={pref.salud_municipio}
              onCheckedChange={(v) => setPref({ ...pref, salud_municipio: v })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={saving}>
          {saving ? "Guardando…" : "Guardar preferencias"}
        </Button>
      </div>
    </div>
  );
}
