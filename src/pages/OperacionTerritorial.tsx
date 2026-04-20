import { Network, MapPinned, Target, Smartphone, Users, BarChart3 } from "lucide-react";
import { ModuloProximamente } from "@/components/ModuloProximamente";

export default function OperacionTerritorial() {
  return (
    <ModuloProximamente
      moduloKey="territorial"
      eyebrow="Operación de campaña"
      titulo="Operación territorial"
      tagline="Convierte la estrategia en estructura: coordinadores, seccionales y promotores con metas, captura puerta a puerta y avance en vivo por sección electoral."
      porQue="La elección no se gana solo en redes ni en encuestas: se gana en la calle. Este módulo te permitirá medir y dirigir el esfuerzo territorial con la misma precisión con la que hoy analizas datos."
      acentoClass="from-emerald-500/20 via-primary/5 to-transparent"
      capacidades={[
        {
          icon: Network,
          titulo: "Estructura jerárquica",
          detalle: "Coordinador estatal → distrital → municipal → seccional → promotor, con metas y responsables.",
        },
        {
          icon: Smartphone,
          titulo: "App móvil para promotores",
          detalle: "PWA ligera para levantar simpatizantes, fotos y notas con geolocalización offline-first.",
        },
        {
          icon: MapPinned,
          titulo: "Cobertura por sección",
          detalle: "Mapa en vivo con secciones cubiertas, en proceso y rezagadas vs. tu camino a la victoria.",
        },
        {
          icon: Target,
          titulo: "Metas vs. avance",
          detalle: "Cumplimiento por equipo y promotor, alertas cuando una sección clave no avanza.",
        },
        {
          icon: Users,
          titulo: "Movilización día D",
          detalle: "Listas de promovidos, ruta de acarreo lícito y check-in de salida a votar.",
        },
        {
          icon: BarChart3,
          titulo: "ROI por estructura",
          detalle: "Mide qué coordinadores rinden más simpatizantes por peso/hora invertida.",
        },
      ]}
    />
  );
}
