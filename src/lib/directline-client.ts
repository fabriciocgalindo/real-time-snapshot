const BASE = "https://directline.botframework.com/v3/directline";

export type BotActivity = {
  id?: string;
  type: string;
  text?: string;
  from?: { id?: string; role?: string };
};

/** Erro que pode ser tentado novamente (timeout/silêncio do agente). */
export class AgentTimeoutError extends Error {
  retryable = true as const;
}

/** Erro que não deve ser retentado (acesso negado, config do bot). */
export class AgentBlockedError extends Error {
  retryable = false as const;
}

export class DirectLineSession {
  private token: string;
  private conversationId: string;
  private watermark: string | null = null;

  private constructor(token: string, conversationId: string) {
    this.token = token;
    this.conversationId = conversationId;
  }

  static async start(token: string): Promise<DirectLineSession> {
    const res = await fetch(`${BASE}/conversations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Não foi possível iniciar a conversa (HTTP ${res.status}).`);
    const data = (await res.json()) as { conversationId: string };
    return new DirectLineSession(token, data.conversationId);
  }

  async sendMessage(text: string): Promise<void> {
    const res = await fetch(`${BASE}/conversations/${this.conversationId}/activities`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "message", from: { id: "tap-canvas-user" }, text }),
    });
    if (!res.ok) throw new Error(`Falha ao enviar mensagem ao bot (HTTP ${res.status}).`);
  }

  private async poll(): Promise<BotActivity[]> {
    const url = `${BASE}/conversations/${this.conversationId}/activities${
      this.watermark ? `?watermark=${this.watermark}` : ""
    }`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
    if (!res.ok) throw new Error(`Falha ao ler respostas do bot (HTTP ${res.status}).`);
    const data = (await res.json()) as { activities: BotActivity[]; watermark?: string };
    if (data.watermark) this.watermark = data.watermark;
    return data.activities ?? [];
  }

  /** Waits for a substantial bot message (the analysis), failing fast when the bot stays silent. */
  async waitForAnalysis(
    opts: {
      timeoutMs?: number;
      firstResponseTimeoutMs?: number;
      onPartial?: (text: string) => void;
      onStatus?: (text: string) => void;
    } = {},
  ): Promise<string> {
    const timeoutMs = opts.timeoutMs ?? 120_000;
    const firstResponseTimeoutMs = opts.firstResponseTimeoutMs ?? 35_000;
    const startedAt = Date.now();
    const deadline = Date.now() + timeoutMs;
    const quietMs = 6_000;

    const chunks: string[] = [];
    let lastMessageAt: number | null = null;
    let statusShown = false;

    while (Date.now() < deadline) {
      const activities = await this.poll();
      for (const a of activities) {
        if (a.from?.id === "tap-canvas-user") continue;

        if (a.type === "typing" && !statusShown) {
          statusShown = true;
          opts.onStatus?.("O PMO Guardian começou a processar o documento...");
          continue;
        }

        if (a.type !== "message" || !a.text) continue;

        const lower = a.text.toLowerCase();
        // Bot-side blockers: fail fast instead of waiting for a timeout.
        if (lower.includes("não tem acesso") || lower.includes("nao tem acesso")) {
          throw new AgentBlockedError(
            "O agente do Copilot Studio recusou a conversa: o canal Direct Line está restrito. " +
              "No Copilot Studio, em Settings > Security > Authentication, selecione \"No authentication\" " +
              "e publique o agente novamente.",
          );
        }

        opts.onPartial?.(a.text);
        chunks.push(a.text);
        lastMessageAt = Date.now();

        // Long answers are the analysis itself — return immediately.
        if (a.text.length > 600) return chunks.join("\n\n");
      }

      // Got something and the bot went quiet: that's the full answer.
      if (lastMessageAt && Date.now() - lastMessageAt > quietMs) {
        return chunks.join("\n\n");
      }

      if (!lastMessageAt && Date.now() - startedAt > firstResponseTimeoutMs) {
        throw new AgentTimeoutError(
          "O Copilot recebeu o documento, mas não retornou resposta inicial. " +
            "Verifique se o agente PMO Guardian está publicado, ativo no canal Direct Line e sem bloqueio de autenticação.",
        );
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    if (chunks.length > 0) return chunks.join("\n\n");
    throw new AgentTimeoutError("O PMO Guardian não respondeu no tempo esperado.");
  }
}

