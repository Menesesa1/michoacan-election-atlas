import { ShieldCheck, Radio, AlertTriangle, ClipboardCheck, Camera, BarChart2 } from "lucide-react";
import { ModuloProximamente } from "@/components/ModuloProximamente";

export default function DiaD() {
  return (
    <ModuloProximamente
      moduloKey="dia_d"
      eyebrow="Operación de campaña"
      titulo="Día D · Control de casilla"
      tagline="Sala de mando para el día de la elección: representantes generales y de casilla coordinados, incidencias en vivo, conteo rápido y alerta temprana de irregularidades."
      porQue="El día de la elección es donde se defiende lo construido. Sin operación de casilla profesional, los resultados se pueden ir aunque hayas ganado en las urnas."
      acentoClass="from-amber-500/20 via-primary/5 to-transparent"
      capacidades={[
        {
          icon: ClipboardCheck,
          titulo: "Asignación de RGs y RCs",
          detalle: "Representantes generales y de casilla por distrito y sección, con confirmación de presencia.",
        },
        {
          icon: Radio,
          titulo: "Reporte en vivo",
          detalle: "Apertura, instalación, votación, cierre y entrega de paquete electoral en tiempo real.",
        },
        {
          icon: AlertTriangle,
          titulo: "Bitácora de incidencias",
          detalle: "Tipificación, fotos y geolocalización para tener evidencia ante el INE/IEM.",
        },
        {
          icon: BarChart2,
          titulo: "Conteo rápido propio",
          detalle: "Captura de actas y proyección de tendencia mientras llegan resultados oficiales.",
        },
        {
          icon: Camera,
          titulo: "Evidencia fotográfica",
          detalle: "Acta de escrutinio escaneada por casilla, archivo legal organizado por distrito.",
        },
        {
          icon: ShieldCheck,
          titulo: "Defensa del voto",
          detalle: "Alertas de coacción, compra del voto o inducción para activar protocolos jurídicos.",
        },
      ]}
    />
  );
}
