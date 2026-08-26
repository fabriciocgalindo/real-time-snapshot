import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Loader2, Sparkles, Upload, Wand2, FileBarChart, Copy, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { ImportDialog } from "@/components/ImportDialog";
import { ReportView } from "@/components/ReportView";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { DirectLineSession, AgentTimeoutError, AgentBlockedError } from "@/lib/directline-client";
import { createDirectLineToken } from "@/lib/directline.functions";
import {
  HEADLESS_PROMPT,
  SECTIONS,
  parseCanvasSections,
  parseReportExtras,
  type SectionKey,
} from "@/lib/tap-canvas";


const WEBCHAT_URL =
  "https://copilotstudio.microsoft.com/environments/Default-24090322-b104-494d-a1d3-662da14cddd4/bots/cr6ae_PMO-GUARDIAM/webchat?__version__=2&enableFileAttachment=false&cliAgent=true";

export const Route = createFileRoute("/canvas")({
  head: () => ({
    meta: [
      { title: "PMO Guardiam | Termo de Abertura de Projeto" },
      {
        name: "description",
        content:
          "Analise o TAP e a ERU com o agente PMO Guardiam: diagnóstico com evidências e o Termo de Abertura estruturado em oito quadrantes.",
      },
      { property: "og:title", content: "PMO Guardiam | Termo de Abertura de Projeto" },
      {
        property: "og:description",
        content:
          "Importe briefings e documentos e tenha o TAP estruturado em oito quadrantes pelo PMO Guardiam.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TapCanvasPage,
});

type Filled = Partial<Record<SectionKey, string[]>>;

function TapCanvasPage() {
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [filled, setFilled] = useState<Filled>({});
  const [report, setReport] = useState<string | null>(null);
  const [tab, setTab] = useState("canvas");

  const runAnalysis = useCallback(async (documentText: string) => {
    setBusy(true);
    setFilled({});
    setReport(null);

    const MAX_ATTEMPTS = 3; // 1 tentativa inicial + 2 retries
    let lastError: unknown = null;

    try {
      const { token } = await createDirectLineToken();

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        setAnalysisStatus(
          attempt === 1
            ? "Iniciando conversa com o agente..."
            : `Tentativa ${attempt} de ${MAX_ATTEMPTS} — reenviando ao PMO Guardiam...`,
        );

        const session = await DirectLineSession.start(token);
        setAnalysisStatus(
          attempt === 1
            ? "Enviando TAP/ERU para análise..."
            : `Tentativa ${attempt} — reenviando documento ao agente...`,
        );
        await session.sendMessage(
          `${HEADLESS_PROMPT}\n\nTEXTO DO DOCUMENTO:\n${documentText}`,
        );
        setAnalysisStatus("Aguardando a primeira resposta do Copilot...");

        try {
          const answer = await session.waitForAnalysis({
            onStatus: (s) => setAnalysisStatus(s),
            onPartial: () => setAnalysisStatus("Recebendo análise do PMO Guardiam..."),
          });
          setReport(answer);
          setFilled(parseCanvasSections(answer));
          setImportOpen(false);
          toast.success("Canvas preenchido pelo PMO Guardiam.");
          return;
        } catch (err) {
          lastError = err;
          // Erros não-retentáveis (acesso negado / config) falham imediatamente.
          if (err instanceof AgentBlockedError) break;
          if (err instanceof AgentTimeoutError && attempt < MAX_ATTEMPTS) {
            toast.warning(
              `O agente demorou a responder. Reenviando (tentativa ${attempt + 1} de ${MAX_ATTEMPTS})...`,
            );
            // Pausa curta antes de reenviar.
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          // Última tentativa ou erro desconhecido: encerra o loop.
          break;
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error("Falha ao analisar o documento após várias tentativas.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao analisar o documento.");
    } finally {
      setBusy(false);
      setAnalysisStatus(null);
    }
  }, []);

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-8 md:px-10 md:py-12">
      <Toaster />

      <header className="flex flex-col gap-6 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            to="/"
            className="font-display text-xs font-semibold tracking-[0.18em] text-brand uppercase transition-opacity hover:opacity-70"
          >
            ← PMO Guardiam
          </Link>
          <h1 className="text-gradient-brand mt-2 text-4xl font-extrabold md:text-5xl">
            PMO Guardiam
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted-foreground">
            Envie o TAP e/ou a ERU e receba o diagnóstico do PMO Guardiam, com o
            Termo de Abertura estruturado em oito quadrantes.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="quiet" size="lg" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> Importar TAP
          </Button>
          <Button
            variant="brand"
            size="lg"
            disabled={busy}
            onClick={() => setImportOpen(true)}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Gerar com Copilot
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="bg-transparent p-0">
          <TabsTrigger value="canvas" className="font-display">
            🖼️ Visão Canvas
          </TabsTrigger>
          <TabsTrigger value="resultados" className="font-display">
            📊 Análise PMO Guardiam
          </TabsTrigger>
          <TabsTrigger value="chat" className="font-display">
            💬 Conversar com o agente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canvas" className="mt-6">
          <div className="grid auto-rows-min grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {SECTIONS.map((section) => {
              const lines = filled[section.key];
              return (
                <article
                  key={section.key}
                  className={`group shadow-card relative flex min-h-56 flex-col overflow-hidden rounded-3xl border border-border bg-card/80 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-brand/40 ${section.span}`}
                >
                  <span className="bg-gradient-brand absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="mb-4 flex items-center gap-3">
                    <span className="bg-brand-soft flex size-10 items-center justify-center rounded-xl text-lg">
                      {section.icon}
                    </span>
                    <h2 className="font-display text-base font-bold">{section.title}</h2>
                  </div>

                  {busy ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-brand-soft text-sm text-brand">
                      <Loader2 className="size-5 animate-spin" />
                      <span className="px-3 text-center">
                        {analysisStatus ?? "Aguardando PMO Guardiam..."}
                      </span>
                    </div>
                  ) : lines && lines.length > 0 ? (
                    <div className="flex-1 space-y-1.5 overflow-auto text-sm leading-relaxed text-foreground/90">
                      {lines.map((line, i) =>
                        /^[-*•]\s/.test(line) ? (
                          <p key={i} className="flex gap-2">
                            <span className="text-brand">•</span>
                            <span>{line.replace(/^[-*•]\s/, "")}</span>
                          </p>
                        ) : (
                          <p key={i}>{line}</p>
                        ),
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setImportOpen(true)}
                      className="hover:border-brand hover:text-brand hover:bg-brand-soft flex flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground transition-colors"
                    >
                      <Sparkles className="size-4" /> {section.hint}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="resultados" className="mt-6">
          <div className="shadow-card rounded-3xl border border-border bg-card/80 p-8 backdrop-blur-md">
            {busy ? (
              <div className="py-20 text-center">
                <Loader2 className="mx-auto mb-5 size-14 animate-spin text-brand" />
                <h2 className="text-2xl font-bold">O PMO Guardiam está analisando...</h2>
                <p className="mt-2 text-muted-foreground">
                  {analysisStatus ??
                    "Isso pode levar até 2 minutos, dependendo do tamanho do documento."}
                </p>
                <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
                  Se o agente não responder em alguns segundos, tente a aba “Conversar com o agente”
                  para validar se o Copilot está publicado e liberado.
                </p>
              </div>
            ) : report ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
                  <div>
                    <h2 className="text-gradient-brand text-2xl font-bold">
                      Relatório extraído pelo PMO Guardiam
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Diagnóstico de TAP e ERU organizado por seção.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard.writeText(report);
                        toast.success("Relatório copiado.");
                      }}
                    >
                      <Copy className="size-4" /> Copiar
                    </Button>
                    <Button variant="quiet" size="sm" onClick={() => window.print()}>
                      <Printer className="size-4" /> Imprimir
                    </Button>
                  </div>
                </div>
                <div className="mt-6 space-y-8">
                  <ExecutiveSummary extras={parseReportExtras(report)} />
                  <ReportView text={report} />
                </div>

              </>
            ) : (
              <div className="py-20 text-center">
                <FileBarChart className="mx-auto mb-5 size-14 text-brand" />
                <h2 className="text-2xl font-bold">Nenhuma análise gerada ainda</h2>
                <p className="mt-2 text-muted-foreground">
                  Importe um TAP ou clique em “Gerar com Copilot” para ver o diagnóstico
                  completo do projeto.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <div className="shadow-card overflow-hidden rounded-3xl border border-border bg-card/80 backdrop-blur-md">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-display text-lg font-bold">PMO Guardiam</h2>
              <p className="text-sm text-muted-foreground">
                Converse diretamente com o agente para analisar o TAP e a ERU.
              </p>
            </div>
            <iframe
              src={WEBCHAT_URL}
              title="Chat do PMO Guardiam"
              className="h-[70vh] w-full border-0 bg-white"
            />
          </div>
        </TabsContent>
      </Tabs>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onAnalyze={(text) => void runAnalysis(text)}
        busy={busy}
      />
    </main>
  );
}
