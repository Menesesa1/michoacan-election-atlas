// Generador de PDF "Dossier de cortesía" para prospectos de candidatura.
// Tono: estratega de élite — sobrio, confidencial, dato + intención.
// Paleta: carbón profundo (#0E0E14) + dorado tenue (#B8945A) + grafito (#2A2A33).

import jsPDF from "jspdf";
import type { Candidato } from "./candidatos/types";
import { FASE_LABEL } from "./candidatos/fase";

const NIVEL_LABEL_LARGO: Record<string, string> = {
  gobernador: "Gubernatura del Estado",
  diputados: "Diputación Local",
  ayuntamientos: "Presidencia Municipal",
};

interface FaseEME {
  numero: string;
  titulo: string;
  promesa: string;
  entregables: string[];
  kpi: string;
}

const FASES_EME: FaseEME[] = [
  {
    numero: "I",
    titulo: "Diagnóstico de Poder",
    promesa:
      "Antes de mover una sola pieza, conocemos el tablero entero. Levantamos un mapa quirúrgico de su territorio: voto duro, voto en disputa, adversarios reales y aliados latentes.",
    entregables: [
      "Auditoría histórica electoral 2018–2024 a nivel sección",
      "Perfilamiento del votante natural y del votante alcanzable",
      "Inteligencia OSINT sobre adversarios y War Rooms rivales",
      "Diagnóstico de paridad y viabilidad jurídica de la candidatura",
    ],
    kpi: "Mapa de competitividad seccional + score de viabilidad",
  },
  {
    numero: "II",
    titulo: "Posicionamiento y Narrativa",
    promesa:
      "Construimos la tesis política que solo usted puede sostener. No frases hechas: una narrativa con nervio, congruente con su trayectoria y con el dolor real del territorio.",
    entregables: [
      "Arquitectura de mensaje 360° (eje racional y eje emocional)",
      "Tres pilares programáticos defendibles ante prensa y debate",
      "Manual de tono, frases paraguas y tabúes verbales",
      "Posicionamiento diferencial frente a cada adversario identificado",
    ],
    kpi: "Narrativa central probada + plataforma de mensaje aprobada",
  },
  {
    numero: "III",
    titulo: "Pre-campaña Inteligente",
    promesa:
      "Mientras los demás esperan el banderazo, usted ya está posicionado. Activación temprana en redes, prensa y territorio sin riesgo legal: cada movimiento auditado por nuestro equipo jurídico.",
    entregables: [
      "Plan de contenidos digitales por plataforma con calendario",
      "Estrategia de influenciadores y voceros aliados",
      "Brigada territorial mínima entrenada y desplegada",
      "Protocolo de blindaje legal precampaña (INE / IEM)",
    ],
    kpi: "Crecimiento orgánico medible y huella territorial inicial",
  },
  {
    numero: "IV",
    titulo: "Campaña Constitucional",
    promesa:
      "El día del banderazo no improvisamos: ejecutamos. Cada semana tiene su hito, cada zona su KPI, cada peso invertido su retorno medido en votos potenciales.",
    entregables: [
      "Plan territorial por municipio/sección con prioridades A/B/C",
      "Calendario semanal de actos, contenidos y prensa",
      "Presupuesto sugerido con asignación por rubro y ROI estimado",
      "War Room de respuesta rápida 24/7 ante crisis y ataques",
    ],
    kpi: "Cumplimiento semanal de KPIs y avance del camino a la victoria",
  },
  {
    numero: "V",
    titulo: "Día D y Defensa del Voto",
    promesa:
      "La elección no se gana solo en las urnas, se gana en la noche del cómputo. Activamos representantes, abogados y monitoreo en tiempo real para que ningún voto se pierda.",
    entregables: [
      "Estructura de representantes de casilla por sección crítica",
      "Sala de comando con monitoreo en tiempo real del PREP",
      "Protocolo jurídico de impugnaciones y actas de incidencia",
      "Comunicación de resultados controlada y narrativa post-jornada",
    ],
    kpi: "Cobertura de casillas prioritarias y defensa exitosa del cómputo",
  },
  {
    numero: "VI",
    titulo: "Transición y Gobierno",
    promesa:
      "Ganar es la mitad del trabajo. Gobernar bien es la otra mitad —y la base de la siguiente victoria. Acompañamos los primeros 100 días con la misma disciplina con que ganamos.",
    entregables: [
      "Plan de los primeros 100 días con hitos comunicables",
      "Mapa de relaciones institucionales y poder local",
      "Sistema de monitoreo reputacional permanente",
      "Estrategia de legado para reelección o salto de cargo",
    ],
    kpi: "Aprobación sostenida y narrativa de gestión instalada",
  },
];

interface DossierInput {
  candidato: Candidato;
  consultor?: string;
}

export function generarDossierCortesia({ candidato, consultor = "Job Meneses" }: DossierInput) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;

  // Paleta confidencial
  const COLOR_FONDO: [number, number, number] = [14, 14, 20];
  const COLOR_TEXTO_OSCURO: [number, number, number] = [30, 30, 40];
  const COLOR_TEXTO_CLARO: [number, number, number] = [240, 235, 225];
  const COLOR_DORADO: [number, number, number] = [184, 148, 90];
  const COLOR_GRAFITO: [number, number, number] = [90, 90, 100];
  const COLOR_LINEA: [number, number, number] = [200, 195, 180];

  let y = 0;

  const setText = (color: [number, number, number]) => doc.setTextColor(...color);
  const setFill = (color: [number, number, number]) => doc.setFillColor(...color);
  const setDraw = (color: [number, number, number]) => doc.setDrawColor(...color);

  // ============= PORTADA =============
  setFill(COLOR_FONDO);
  doc.rect(0, 0, pageW, pageH, "F");

  // Línea superior dorada
  setFill(COLOR_DORADO);
  doc.rect(margin, 70, 60, 2, "F");

  // Marca confidencial
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(COLOR_DORADO);
  doc.text("DOCUMENTO CONFIDENCIAL · USO RESERVADO", margin, 90);

  // Marca EME
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(COLOR_TEXTO_CLARO);
  doc.text("EME · DESARROLLO ELECTORAL", margin, 108);

  // Título principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  setText(COLOR_TEXTO_CLARO);
  doc.text("Dossier", margin, pageH / 2 - 20);
  doc.text("de Estrategia", margin, pageH / 2 + 22);

  // Subtítulo dorado
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setText(COLOR_DORADO);
  doc.text("Hoja de ruta para la conquista del cargo", margin, pageH / 2 + 50);

  // Bloque destinatario
  setFill(COLOR_DORADO);
  doc.rect(margin, pageH - 230, 2, 90, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(COLOR_DORADO);
  doc.text("PREPARADO PARA", margin + 14, pageH - 215);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setText(COLOR_TEXTO_CLARO);
  const nombreLines = doc.splitTextToSize(candidato.nombre.toUpperCase(), contentW - 14);
  doc.text(nombreLines, margin + 14, pageH - 192);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(COLOR_TEXTO_CLARO);
  const cargoLabel = candidato.cargo_buscado || NIVEL_LABEL_LARGO[candidato.nivel] || candidato.nivel;
  doc.text(`Aspirante a ${cargoLabel}`, margin + 14, pageH - 165);
  doc.text(`${candidato.territorio} · ${candidato.partido}`, margin + 14, pageH - 150);

  // Footer portada
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(COLOR_GRAFITO);
  doc.text(
    `Entregado por ${consultor} · ${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}`,
    margin,
    pageH - 50,
  );
  setText(COLOR_DORADO);
  doc.text("emedesarrolloelectoral.com", pageW - margin, pageH - 50, { align: "right" });

  // ============= PÁGINA 2: CARTA DE INTENCIÓN =============
  doc.addPage();
  y = margin + 20;

  // Header sutil
  setDraw(COLOR_DORADO);
  doc.setLineWidth(0.5);
  doc.line(margin, margin, margin + 40, margin);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(COLOR_DORADO);
  doc.text("01 · TESIS", margin, margin - 6);

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  setText(COLOR_TEXTO_OSCURO);
  doc.text("Por qué este documento existe", margin, y);
  y += 36;

  // Cuerpo
  const tesisParrafos = [
    `Las campañas no se ganan con voluntarismo. Se ganan con disciplina, datos y un equipo que entienda que el adversario también está leyendo el mismo terreno.`,
    `Este dossier es la primera pieza de una conversación seria. No vendemos esperanza: ofrecemos un método probado para convertir su aspiración en una candidatura viable, su candidatura en una victoria medible, y su victoria en un gobierno que sostenga el legado.`,
    `Lo que verá en las próximas páginas son las seis fases que recorreremos juntos. Cada una con entregables concretos, KPIs auditables y una promesa: en cada fase construiremos realidades, no narrativas vacías.`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setText(COLOR_TEXTO_OSCURO);
  tesisParrafos.forEach((p) => {
    const lines = doc.splitTextToSize(p, contentW);
    doc.text(lines, margin, y, { lineHeightFactor: 1.55 });
    y += lines.length * 11 * 1.55 + 14;
  });

  // Cita destacada
  y += 20;
  setFill(COLOR_DORADO);
  doc.rect(margin, y - 10, 3, 60, "F");
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(14);
  setText(COLOR_TEXTO_OSCURO);
  const citaLines = doc.splitTextToSize(
    `"Una campaña sin método es un acto de fe. Con método, es un acto de poder."`,
    contentW - 20,
  );
  doc.text(citaLines, margin + 16, y + 6, { lineHeightFactor: 1.4 });
  y += citaLines.length * 14 * 1.4 + 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(COLOR_GRAFITO);
  doc.text(`— ${consultor}, Director de Estrategia`, margin + 16, y);

  // ============= PÁGINA 3: VISIÓN GENERAL DE LAS 6 FASES =============
  doc.addPage();
  y = margin + 20;

  setDraw(COLOR_DORADO);
  doc.line(margin, margin, margin + 40, margin);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(COLOR_DORADO);
  doc.text("02 · ARQUITECTURA", margin, margin - 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  setText(COLOR_TEXTO_OSCURO);
  doc.text("El método de seis fases", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  setText(COLOR_GRAFITO);
  doc.text("Del primer diagnóstico al gobierno consolidado.", margin, y + 12);
  y += 40;

  // Lista compacta de las 6 fases
  FASES_EME.forEach((fase) => {
    if (y > pageH - 90) {
      doc.addPage();
      y = margin + 20;
    }
    // Número romano dorado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    setText(COLOR_DORADO);
    doc.text(fase.numero, margin, y + 4);

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setText(COLOR_TEXTO_OSCURO);
    doc.text(fase.titulo, margin + 50, y);

    // Promesa breve (primera línea)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setText(COLOR_GRAFITO);
    const breve = doc.splitTextToSize(fase.promesa, contentW - 50);
    doc.text(breve.slice(0, 2), margin + 50, y + 14, { lineHeightFactor: 1.4 });

    // Línea separadora
    setDraw(COLOR_LINEA);
    doc.setLineWidth(0.25);
    doc.line(margin, y + 50, pageW - margin, y + 50);

    y += 64;
  });

  // ============= UNA PÁGINA POR FASE =============
  FASES_EME.forEach((fase, idx) => {
    doc.addPage();
    y = margin + 20;

    // Header
    setDraw(COLOR_DORADO);
    doc.setLineWidth(0.5);
    doc.line(margin, margin, margin + 40, margin);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(COLOR_DORADO);
    doc.text(`FASE ${fase.numero} · ${String(idx + 3).padStart(2, "0")}`, margin, margin - 6);

    // Número grande de fondo (efecto editorial)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(140);
    setText([245, 240, 230]);
    doc.text(fase.numero, pageW - margin - 80, y + 80);

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(COLOR_DORADO);
    doc.text(`FASE ${fase.numero}`, margin, y);
    y += 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    setText(COLOR_TEXTO_OSCURO);
    const tituloLines = doc.splitTextToSize(fase.titulo, contentW - 100);
    doc.text(tituloLines, margin, y);
    y += tituloLines.length * 28 + 24;

    // Promesa
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11.5);
    setText(COLOR_TEXTO_OSCURO);
    const promesaLines = doc.splitTextToSize(fase.promesa, contentW);
    doc.text(promesaLines, margin, y, { lineHeightFactor: 1.55 });
    y += promesaLines.length * 11.5 * 1.55 + 30;

    // Separador dorado
    setFill(COLOR_DORADO);
    doc.rect(margin, y, 30, 2, "F");
    y += 24;

    // Subtítulo entregables
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(COLOR_DORADO);
    doc.text("LO QUE PONEMOS EN SUS MANOS", margin, y);
    y += 18;

    // Lista de entregables
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    setText(COLOR_TEXTO_OSCURO);
    fase.entregables.forEach((ent) => {
      // Bullet dorado cuadrado
      setFill(COLOR_DORADO);
      doc.rect(margin, y - 7, 4, 4, "F");
      const lines = doc.splitTextToSize(ent, contentW - 16);
      doc.text(lines, margin + 14, y, { lineHeightFactor: 1.5 });
      y += lines.length * 10.5 * 1.5 + 8;
    });

    // KPI al pie
    y = pageH - 110;
    setFill([248, 245, 235]);
    doc.rect(margin, y, contentW, 60, "F");
    setFill(COLOR_DORADO);
    doc.rect(margin, y, 3, 60, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(COLOR_DORADO);
    doc.text("CÓMO SE MIDE EL ÉXITO DE ESTA FASE", margin + 16, y + 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(COLOR_TEXTO_OSCURO);
    const kpiLines = doc.splitTextToSize(fase.kpi, contentW - 30);
    doc.text(kpiLines, margin + 16, y + 36);

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(COLOR_GRAFITO);
    doc.text(`EME · Dossier para ${candidato.nombre}`, margin, pageH - 30);
    doc.text(`Página ${idx + 4}`, pageW - margin, pageH - 30, { align: "right" });
  });

  // ============= PÁGINA FINAL: CIERRE =============
  doc.addPage();
  setFill(COLOR_FONDO);
  doc.rect(0, 0, pageW, pageH, "F");

  setFill(COLOR_DORADO);
  doc.rect(margin, 70, 60, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(COLOR_DORADO);
  doc.text("CIERRE", margin, 90);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  setText(COLOR_TEXTO_CLARO);
  const cierreT = doc.splitTextToSize("La siguiente conversación define la elección.", contentW);
  doc.text(cierreT, margin, pageH / 2 - 40, { lineHeightFactor: 1.2 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setText([200, 195, 180]);
  const cierreP = doc.splitTextToSize(
    `${candidato.nombre.split(" ")[0]}, este dossier es solo el primer movimiento. La verdadera ventaja se construye en la mesa, con números reales sobre ${candidato.territorio}, su contienda específica y la ventana de tiempo que tenemos antes de que el tablero se cierre.`,
    contentW,
  );
  doc.text(cierreP, margin, pageH / 2 + 10, { lineHeightFactor: 1.6 });

  // Bloque de contacto
  setFill([26, 26, 34]);
  doc.rect(margin, pageH - 200, contentW, 110, "F");
  setFill(COLOR_DORADO);
  doc.rect(margin, pageH - 200, 3, 110, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(COLOR_DORADO);
  doc.text("AGENDAR LA SIGUIENTE REUNIÓN", margin + 18, pageH - 175);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setText(COLOR_TEXTO_CLARO);
  doc.text(consultor, margin + 18, pageH - 152);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText([200, 195, 180]);
  doc.text("Director de Estrategia · EME Desarrollo Electoral", margin + 18, pageH - 134);
  doc.text("emedesarrolloelectoral.com", margin + 18, pageH - 116);

  // Footer confidencial
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(COLOR_GRAFITO);
  doc.text(
    "Documento estrictamente confidencial. Distribución limitada al destinatario nombrado en portada.",
    pageW / 2,
    pageH - 40,
    { align: "center" },
  );

  // Guardar
  const safeName = candidato.nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  doc.save(`dossier-eme-${safeName}.pdf`);
}
