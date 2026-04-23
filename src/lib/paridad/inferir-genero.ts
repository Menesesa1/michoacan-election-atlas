// Inferencia heurística de género (M/H) a partir del nombre de pila.
// Cobertura priorizada: nombres comunes en datos electorales de Michoacán 2015-2024.
// Marca como "ambiguo" lo que no pueda decidir con confianza alta.

export type Genero = "M" | "H" | "ambiguo";

// Sets compactos pero suficientes para la base actual de presidentes municipales
// y aspirantes esperados. Se complementan con sufijos morfológicos.
const NOMBRES_M = new Set<string>([
  "maria", "ma", "guadalupe", "lupita", "ana", "ana maria", "anita",
  "margarita", "magdalena", "yolanda", "aurora", "cristina", "itze", "itzé",
  "elena", "patricia", "paty", "rosa", "rosalia", "rosalía", "rocio", "rocío",
  "alma", "alejandra", "alondra", "araceli", "beatriz", "blanca", "carmen",
  "claudia", "concepcion", "concepción", "consuelo", "diana", "dolores",
  "elizabeth", "eva", "fabiola", "francisca", "gabriela", "gloria", "irene",
  "isabel", "josefina", "juana", "julia", "laura", "leticia", "lilia", "lorena",
  "lucia", "lucía", "luz", "marisol", "marta", "martha", "mercedes", "mireya",
  "monica", "mónica", "nadia", "natalia", "norma", "olivia", "ofelia", "patricia",
  "pilar", "raquel", "rebeca", "rosario", "sandra", "silvia", "sofia", "sofía",
  "soledad", "susana", "teresa", "veronica", "verónica", "victoria", "violeta",
  "virginia", "ximena", "yesenia", "zoe", "esther", "irma", "alicia", "amanda",
  "andrea", "barbara", "bárbara", "berenice", "carolina", "celia", "clara",
  "daniela", "delia", "edith", "elsa", "elvira", "estela", "ericka", "erika",
  "fatima", "fátima", "felipa", "fernanda", "flora", "graciela", "ines", "inés",
  "ivonne", "jacqueline", "janeth", "judith", "liliana", "lourdes", "magaly",
  "manuela", "marcela", "maribel", "miriam", "morelia", "noemi", "noemí",
  "perla", "petra", "regina", "sara", "selene", "stefani", "tatiana", "ursula",
  "valentina", "valeria", "vanessa", "wendy", "xochitl", "xóchitl", "zaira",
]);

const NOMBRES_H = new Set<string>([
  "jose", "josé", "juan", "luis", "carlos", "miguel", "pedro", "pablo",
  "francisco", "fernando", "felipe", "javier", "jorge", "ricardo", "raul", "raúl",
  "alfonso", "alberto", "alejandro", "andres", "andrés", "antonio", "armando",
  "arturo", "agustin", "agustín", "baltazar", "benjamin", "benjamín", "bernardo",
  "cesar", "césar", "claudio", "cuauhtemoc", "cuauhtémoc", "daniel", "david",
  "diego", "edgar", "edmundo", "eduardo", "efrain", "efraín", "elias", "elías",
  "emilio", "enrique", "ernesto", "esteban", "eugenio", "fabian", "fabián",
  "federico", "fidel", "filiberto", "gabriel", "gerardo", "german", "germán",
  "gilberto", "gonzalo", "guillermo", "gustavo", "hector", "héctor", "hilario",
  "homero", "horacio", "hugo", "humberto", "ignacio", "isidro", "ismael",
  "israel", "ivan", "iván", "jaime", "joaquin", "joaquín", "joel", "jonathan",
  "julian", "julián", "julio", "leonardo", "leonel", "leopoldo", "lorenzo",
  "manuel", "marco", "marcos", "mario", "martin", "martín", "mauricio", "maximo",
  "máximo", "mateo", "mauro", "moises", "moisés", "nicolas", "nicolás", "noe",
  "noé", "octavio", "omar", "oscar", "óscar", "pascual", "patricio", "rafael",
  "ramon", "ramón", "raymundo", "renato", "rene", "rené", "reyes", "roberto",
  "rodolfo", "rodrigo", "rogelio", "rolando", "roman", "román", "ruben", "rubén",
  "rufino", "salvador", "samuel", "santiago", "santos", "sebastian", "sebastián",
  "sergio", "silvestre", "simon", "simón", "tomas", "tomás", "tony", "ulises",
  "uriel", "valentin", "valentín", "vicente", "victor", "víctor", "vidal",
  "wilfrido", "yair", "abel", "abraham", "adan", "adán", "adrian", "adrián",
  "agripino", "alvaro", "álvaro", "amado", "amilcar", "amílcar", "anselmo",
  "aristeo", "arnulfo", "audifaz", "aureliano", "aurelio", "ausencio", "avelino",
  "baudelio", "celestino", "ciro", "cirilo", "cristian", "cristobal", "cristóbal",
  "delfino", "demetrio", "dionisio", "donato", "ezequiel", "felix", "félix",
  "fortino", "froylan", "froylán", "gilberto", "godofredo", "isaias", "isaías",
  "jacinto", "jeremias", "jeremías", "jesus", "jesús", "leobardo", "lino",
  "macario", "marcial", "matias", "matías", "natalio", "nestor", "néstor",
  "obed", "onesimo", "onésimo", "porfirio", "primitivo", "rigoberto", "saul",
  "saúl", "tadeo", "trinidad", "victorino",
]);

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zñ\s]/g, " ")
    .trim();
}

/**
 * Infiere género a partir de nombre completo.
 * - Si encuentra "María de" o "María del" → M (frecuente en compuestos).
 * - Busca cada token contra sets M/H.
 * - Fallback morfológico: termina en "a" → tendencia M; en "o", "el", "io", "án" → H.
 */
export function inferirGenero(nombreCompleto: string): { genero: Genero; confianza: "alta" | "media" | "baja"; basadoEn: string } {
  if (!nombreCompleto) return { genero: "ambiguo", confianza: "baja", basadoEn: "vacío" };
  const limpio = normalizar(nombreCompleto);

  // Patrón "Maria/Ma. de(l) X" → casi siempre mujer
  if (/\bma(ria)?\b\s+(de|del)\s+/.test(limpio)) {
    return { genero: "M", confianza: "alta", basadoEn: "compuesto María de…" };
  }

  const tokens = limpio.split(/\s+/).filter(Boolean);
  // Probar primer y segundo nombre (los más significativos)
  for (let i = 0; i < Math.min(tokens.length, 3); i++) {
    const t = tokens[i];
    if (NOMBRES_M.has(t)) return { genero: "M", confianza: "alta", basadoEn: `nombre "${t}"` };
    if (NOMBRES_H.has(t)) return { genero: "H", confianza: "alta", basadoEn: `nombre "${t}"` };
  }

  // Fallback morfológico sobre el primer token
  const primero = tokens[0] ?? "";
  if (primero.length >= 4) {
    if (/(o|on|or|el|io|an|in|us)$/.test(primero)) {
      return { genero: "H", confianza: "baja", basadoEn: `terminación de "${primero}"` };
    }
    if (/a$/.test(primero) && !/(ista|ema|ima)$/.test(primero)) {
      return { genero: "M", confianza: "baja", basadoEn: `terminación de "${primero}"` };
    }
  }

  return { genero: "ambiguo", confianza: "baja", basadoEn: "sin coincidencia" };
}

/** Aplica overrides manuales sobre la inferencia (para corregir desde UI). */
export function inferirGeneroConOverride(
  nombreCompleto: string,
  override?: Genero | null,
): { genero: Genero; confianza: "alta" | "media" | "baja"; basadoEn: string; overridden: boolean } {
  if (override === "M" || override === "H") {
    return { genero: override, confianza: "alta", basadoEn: "corrección manual", overridden: true };
  }
  return { ...inferirGenero(nombreCompleto), overridden: false };
}
