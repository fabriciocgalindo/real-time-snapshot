export type SectionKey =
  | "justificativa"
  | "objetivos"
  | "requisitos"
  | "escopo"
  | "stakeholders"
  | "riscos"
  | "cronograma"
  | "custos";

export type CanvasSection = {
  key: SectionKey;
  icon: string;
  title: string;
  hint: string;
  /** Tailwind span classes for the 4-column canvas grid (lg and up). */
  span: string;
};

export const SECTIONS: CanvasSection[] = [
  {
    key: "justificativa",
    icon: "💡",
    title: "Justificativa e Propósito",
    hint: "Descreva o problema ou oportunidade que originou o projeto.",
    span: "lg:col-span-1 lg:row-span-2",
  },
  {
    key: "objetivos",
    icon: "🎯",
    title: "Objetivos (SMART) e Indicadores",
    hint: "Metas mensuráveis e indicadores de sucesso.",
    span: "lg:col-span-2",
  },
  {
    key: "escopo",
    icon: "📦",
    title: "Escopo Macro",
    hint: "O que está dentro e o que está fora do escopo.",
    span: "lg:col-span-1 lg:row-span-2",
  },
  {
    key: "requisitos",
    icon: "📋",
    title: "Requisitos e Premissas",
    hint: "Restrições e premissas fundamentais.",
    span: "lg:col-span-2",
  },
  {
    key: "stakeholders",
    icon: "👥",
    title: "Stakeholders e Equipe",
    hint: "Patrocinador, gerente e demais envolvidos.",
    span: "lg:col-span-1",
  },
  {
    key: "riscos",
    icon: "⚠️",
    title: "Riscos Iniciais",
    hint: "Ameaças de alto nível identificadas.",
    span: "lg:col-span-1",
  },
  {
    key: "cronograma",
    icon: "🗓️",
    title: "Marcos e Cronograma",
    hint: "Entregas principais e prazos.",
    span: "lg:col-span-1",
  },
  {
    key: "custos",
    icon: "💰",
    title: "Orçamento Estimado",
    hint: "Custos macro previstos.",
    span: "lg:col-span-1",
  },
];

export const HEADLESS_PROMPT =
  "Analise os arquivos em anexo (ou o texto enviado) — TAP e ERU — e produza um diagnóstico documental. Retorne OBRIGATORIAMENTE no seu texto os seguintes cabeçalhos, cada um isolado em uma linha:\n" +
  "[Resumo Executivo] — 3 a 5 frases para o Gerente de Projeto, com o estado geral do TAP/ERU e a principal decisão necessária.\n" +
  "[Score Documental] — apenas um número de 0 a 100 representando a saúde da documentação, seguido de uma frase curta de justificativa.\n" +
  "[Documentos Ausentes] — lista de documentos ou informações ausentes no cenário analisado.\n" +
  "[Riscos Classificados] — lista de riscos no formato 'Alta | descrição do risco' usando Alta, Média ou Baixa como criticidade.\n" +
  "[Recomendações] — lista de recomendações acionáveis e objetivas.\n" +
  "[Justificativa], [Objetivos], [Requisitos], [Escopo], [Stakeholders], [Riscos], [Cronograma], [Custos] — conteúdo extraído de forma sucinta para preencher o TAP Canvas.\n" +
  "Não omita nenhum cabeçalho. Se não houver informação, escreva 'Não identificado no documento'.";

const KEYWORDS: SectionKey[] = [
  "justificativa",
  "objetivos",
  "requisitos",
  "escopo",
  "stakeholders",
  "riscos",
  "cronograma",
  "custos",
];

export type RiskLevel = "alta" | "media" | "baixa" | "indefinida";

export type ReportExtras = {
  summary: string[];
  score: number | null;
  scoreNote: string | null;
  missing: string[];
  risks: { level: RiskLevel; text: string }[];
  recommendations: string[];
};

type ExtraKey = "summary" | "score" | "missing" | "risks" | "recommendations";

const EXTRA_HEADERS: { key: ExtraKey; match: RegExp }[] = [
  { key: "summary", match: /^\W*resumoexecutivo/ },
  { key: "score", match: /^\W*score/ },
  { key: "missing", match: /^\W*(documentosausentes|informacoesausentes|lacunas)/ },
  { key: "risks", match: /^\W*riscos(classificados|criticidade)/ },
  { key: "recommendations", match: /^\W*(recomendacoes|acoesrecomendadas)/ },
];

function normalize(line: string) {
  return line
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z]/g, "");
}

function matchExtraHeader(line: string): ExtraKey | null {
  if (line.length > 45) return null;
  const n = normalize(line);
  return EXTRA_HEADERS.find((h) => h.match.test(n))?.key ?? null;
}

function clean(line: string) {
  return line
    .replace(/\*\*/g, "")
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

function riskLevel(raw: string): RiskLevel {
  const n = normalize(raw);
  if (/(alta|alto|critic)/.test(n)) return "alta";
  if (/(media|medio|moderad)/.test(n)) return "media";
  if (/(baixa|baixo)/.test(n)) return "baixa";
  return "indefinida";
}

/** Extracts the executive summary, documental score, gaps, ranked risks and actions. */
export function parseReportExtras(text: string): ReportExtras {
  const extras: ReportExtras = {
    summary: [],
    score: null,
    scoreNote: null,
    missing: [],
    risks: [],
    recommendations: [],
  };
  let current: ExtraKey | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const header = matchExtraHeader(line);
    if (header) {
      current = header;
      continue;
    }
    // A canvas section header ends the extras block.
    if (
      line.length < 40 &&
      KEYWORDS.some((k) => normalize(line) === k || normalize(line).startsWith(k))
    ) {
      current = null;
      continue;
    }
    if (!current) continue;

    const value = clean(line);
    if (!value) continue;

    if (current === "score") {
      const num = value.match(/(\d{1,3})\s*(?:\/\s*(10|100))?/);
      if (num && extras.score === null) {
        let score = Number(num[1]);
        if (num[2] === "10") score *= 10;
        extras.score = Math.max(0, Math.min(100, score));
        const note = value.replace(num[0], "").replace(/^[\s\-–—:.,/]+/, "").trim();
        if (note) extras.scoreNote = note;
      } else if (!extras.scoreNote) {
        extras.scoreNote = value;
      }
      continue;
    }

    if (current === "risks") {
      const parts = value.split(/\s*[|–—:]\s*/);
      if (parts.length > 1) {
        const level = riskLevel(parts[0]!);
        extras.risks.push({
          level,
          text: level === "indefinida" ? value : parts.slice(1).join(" — ").trim(),
        });
      } else {
        extras.risks.push({ level: riskLevel(value), text: value });
      }
      continue;
    }

    extras[current].push(value);
  }

  return extras;
}

/** Slices a bot reply into the canvas sections by detecting header lines. */
export function parseCanvasSections(text: string): Partial<Record<SectionKey, string[]>> {
  const data: Partial<Record<SectionKey, string[]>> = {};
  let current: SectionKey | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    if (matchExtraHeader(line)) {
      current = null;
      continue;
    }

    const normalized = normalize(line);

    const found = KEYWORDS.find(
      (k) => normalized.includes(k) && line.length < k.length + 15,
    );

    if (found) {
      current = found;
      data[current] = [];
    } else if (current) {
      data[current]!.push(line.replace(/\*\*/g, ""));
    }
  }

  return data;
}

