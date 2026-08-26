import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardList,
  FileBarChart,
  FileSearch,
  FileText,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const TITLE = "PMO Guardiam — análise de TAP e ERU";
const DESCRIPTION =
  "Envie o Termo de Abertura de Projeto (TAP) e a Especificação de Requisitos de Usuário (ERU) e receba o diagnóstico do agente PMO Guardiam antes de seguir para o comitê.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: FileText,
    title: "Análise do TAP",
    text: "O agente revisa o Termo de Abertura de Projeto: justificativa, objetivos, escopo, stakeholders, riscos, cronograma e orçamento.",
  },
  {
    icon: ClipboardList,
    title: "Análise da ERU",
    text: "A Especificação de Requisitos de Usuário é avaliada quanto à clareza, completude e rastreabilidade dos requisitos.",
  },
  {
    icon: FileSearch,
    title: "Diagnóstico do PMO Guardiam",
    text: "O agente aponta o que falta, por que importa e a quem perguntar. Ele orienta, nunca redige por você.",
  },
  {
    icon: Upload,
    title: "Importação de documentos",
    text: "PDF, DOCX, XLSX ou texto colado. O conteúdo é extraído no navegador e enviado como contexto da análise.",
  },
  {
    icon: ShieldCheck,
    title: "Análise só do que foi anexado",
    text: "Guardrail rígido: nada é inventado. A ausência de informação é tratada como achado.",
  },
  {
    icon: FileBarChart,
    title: "Avaliação de qualidade",
    text: "Cada documento recebe leitura crítica com evidência citada do próprio texto enviado.",
  },
];

const DOCS = [
  {
    tag: "Documento 01",
    title: "TAP — Termo de Abertura de Projeto",
    text: "Formaliza a existência do projeto: problema, objetivos, escopo macro, stakeholders, riscos iniciais, marcos e orçamento.",
  },
  {
    tag: "Documento 02",
    title: "ERU — Especificação de Requisitos de Usuário",
    text: "Detalha o que os usuários esperam da solução. O agente verifica se os requisitos sustentam os objetivos do TAP.",
  },
];

const STEPS = [
  {
    title: "Envie os documentos",
    text: "Suba o TAP e/ou a ERU (PDF, DOCX, XLSX) ou cole o texto diretamente.",
  },
  {
    title: "O PMO Guardiam analisa",
    text: "O agente lê apenas o que foi anexado e identifica lacunas, inconsistências e riscos.",
  },
  {
    title: "Receba o diagnóstico",
    text: "Parecer estruturado com evidências do documento, pronto para revisão com o time.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand text-brand-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-base font-extrabold tracking-tight">
              PMO Guardiam
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <a
              href="#recursos"
              className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Recursos
            </a>
            <a
              href="#como-funciona"
              className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Como funciona
            </a>
            <Button asChild variant="brand" size="sm">
              <Link to="/canvas">Abrir o canvas</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-gradient-brand opacity-20 blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold text-brand">
              <Sparkles className="size-3.5" /> Agente PMO Guardiam
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              TAP e ERU revisados antes de virarem problema
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              {DESCRIPTION}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="brand" size="lg">
                <Link to="/canvas">
                  Analisar meus documentos <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="soft" size="lg">
                <a href="#recursos">Ver como funciona</a>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Sem instalação. Seus documentos são lidos no navegador.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Dois documentos, uma análise integrada
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Nesta primeira fase, a plataforma é dedicada à leitura crítica dos dois
            artefatos que sustentam a iniciação do projeto.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {DOCS.map((doc) => (
              <article
                key={doc.title}
                className="rounded-2xl border border-border/70 bg-card/60 p-8 backdrop-blur-sm transition-colors hover:border-brand/40"
              >
                <span className="font-display text-xs font-bold tracking-widest text-brand uppercase">
                  {doc.tag}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold">{doc.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{doc.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="recursos" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Funções da plataforma
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Tudo que o Gerente de Projetos precisa para chegar ao comitê com
            documentação defensável.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-brand/40"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-16">
          <div className="rounded-3xl border border-border/70 bg-card/60 p-8 backdrop-blur-sm sm:p-12">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Como funciona
            </h2>
            <ol className="mt-8 grid gap-3 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-border/60 bg-background/60 p-5"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-brand-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Comece pelo documento que você já tem
          </h2>
          <p className="mt-4 text-muted-foreground">
            Suba o TAP, a ERU ou os dois e receba o diagnóstico em minutos.
          </p>
          <Button asChild variant="brand" size="lg" className="mt-8">
            <Link to="/canvas">
              Abrir o canvas <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-muted-foreground sm:flex-row">
          <span>PMO Guardiam — análise de TAP e ERU.</span>
          <span>PMO Guardiam orienta, nunca redige.</span>
        </div>
      </footer>
    </div>
  );
}
