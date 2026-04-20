import { UserCheck, MessageCircle, Filter, TrendingUp, History, Workflow } from "lucide-react";
import { ModuloProximamente } from "@/components/ModuloProximamente";

export default function CrmSimpatizantes() {
  return (
    <ModuloProximamente
      moduloKey="crm"
      eyebrow="Operación de campaña"
      titulo="CRM de simpatizantes"
      tagline="Una base viva de afines, indecisos, opositores y líderes — segmentada por sección, con scoring de afinidad y campañas de WhatsApp/SMS dirigidas."
      porQue="Saber quién es quién y haberle hablado en el momento correcto puede mover el margen necesario para ganar. El CRM convierte tu universo de contactos en un activo movilizable y medible."
      acentoClass="from-blue-500/20 via-primary/5 to-transparent"
      capacidades={[
        {
          icon: Filter,
          titulo: "Segmentación inteligente",
          detalle: "Afín, indeciso, opositor, líder de opinión, joven 18-29, mujer adulta mayor, etc.",
        },
        {
          icon: TrendingUp,
          titulo: "Scoring de afinidad",
          detalle: "Modelo IA que prioriza a quién contactar primero según probabilidad de voto.",
        },
        {
          icon: MessageCircle,
          titulo: "Campañas WhatsApp / SMS",
          detalle: "Mensajes personalizados por segmento y sección, con tracking de respuesta.",
        },
        {
          icon: History,
          titulo: "Historial de contactos",
          detalle: "Cada llamada, visita y mensaje quedan registrados por contacto y promotor.",
        },
        {
          icon: UserCheck,
          titulo: "Líderes y multiplicadores",
          detalle: "Identifica y nutre a quienes mueven a 10+ votantes en su entorno.",
        },
        {
          icon: Workflow,
          titulo: "Automatizaciones",
          detalle: "Flujos de bienvenida, invitación a eventos y recordatorio de día de la elección.",
        },
      ]}
    />
  );
}
