import { AlertTriangle, ClipboardList, FileSearch, Gauge, Lightbulb } from "lucide-react";

import type { ReportExtras, RiskLevel } from "@/lib/tap-canvas";

const RISK_STYLES: Record<RiskLevel, { label: string; className: string }> = {
  alta: { label: "Alta", className: "bg-destructive/15 text-destructive border-destructive/30" },
  media: { label: "Média", className: "bg-brand-soft text-brand border-brand/30" },
  baixa: {
    label: "Baixa",
    className: "bg-muted text-muted-foreground border-border",
  },
  indefinida: {
    label: "A classificar",
    className: "bg-muted text-muted-foreground border-border",
  },
};

function ScoreDial({ score }: { score: number }) {
  const r = 34;
  const circumference = Math.PI * r; // half circle
  const filled = (score / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 46" className="w-24">
        <path
          d="M6 40 A34 34 0 0 1 74 40"
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M6 40 A34 34 0 0 1 74 40"
          fill="none"
          stroke="currentColor"
          className="text-brand"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div>
        <p className="font-display text-3xl font-extrabold leading-none">{score}</p>
        <p className="text-xs tracking-wide text-muted-foreground uppercase">/ 100</p>
      </div>
    </div>
  );
}

function List({
  icon,
  title,
  items,
  marker,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  marker: "check" | "star";
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="bg-brand-soft text-brand flex size-8 items-center justify-center rounded-lg">
          {icon}
        </span>
        <h4 className="font-display text-sm font-bold tracking-wide uppercase">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
            <span className="text-brand mt-px shrink-0">{marker === "check" ? "✓" : "★"}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExecutiveSummary({ extras }: { extras: ReportExtras }) {
  const hasContent =
    extras.summary.length > 0 ||
    extras.score !== null ||
    extras.missing.length > 0 ||
    extras.risks.length > 0 ||
    extras.recommendations.length > 0;

  if (!hasContent) return null;

  return (
    <section className="space-y-5">
      <div className="border-brand/25 from-brand-soft/70 rounded-3xl border bg-gradient-to-br to-transparent p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-64 flex-1">
            <p className="font-display text-brand text-xs font-semibold tracking-[0.18em] uppercase">
              Resumo executivo
            </p>
            <h3 className="font-display mt-1 text-xl font-bold">Leitura rápida para o GP</h3>
            {extras.summary.length > 0 ? (
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">
                {extras.summary.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                O agente não retornou o resumo executivo nesta análise.
              </p>
            )}
          </div>

          {extras.score !== null && (
            <div className="rounded-2xl border border-border bg-card/70 p-5">
              <div className="mb-2 flex items-center gap-2">
                <Gauge className="text-brand size-4" />
                <p className="font-display text-xs font-bold tracking-wide uppercase">
                  Saúde documental
                </p>
              </div>
              <ScoreDial score={extras.score} />
              {extras.scoreNote && (
                <p className="mt-2 max-w-56 text-xs leading-relaxed text-muted-foreground">
                  {extras.scoreNote}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {extras.risks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="bg-brand-soft text-brand flex size-8 items-center justify-center rounded-lg">
              <AlertTriangle className="size-4" />
            </span>
            <h4 className="font-display text-sm font-bold tracking-wide uppercase">
              Riscos por criticidade
            </h4>
          </div>
          <ul className="space-y-2">
            {extras.risks.map((risk, i) => {
              const style = RISK_STYLES[risk.level];
              return (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2"
                >
                  <span
                    className={`font-display rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold tracking-wide uppercase ${style.className}`}
                  >
                    {style.label}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed text-foreground/90">
                    {risk.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <List
          icon={<FileSearch className="size-4" />}
          title="Documentos / informações ausentes"
          items={extras.missing}
          marker="check"
        />
        <List
          icon={<Lightbulb className="size-4" />}
          title="Recomendações acionáveis"
          items={extras.recommendations}
          marker="star"
        />
      </div>

      {extras.summary.length > 0 && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList className="size-3.5" /> Detalhamento completo por seção logo abaixo.
        </p>
      )}
    </section>
  );
}
