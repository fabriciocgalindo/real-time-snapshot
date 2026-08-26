import { createServerFn } from "@tanstack/react-start";

/**
 * Exchanges the Direct Line secret (server-side only) for a short-lived token
 * so the browser never sees the secret.
 */
export const createDirectLineToken = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ token: string }> => {
    const secret = process.env["DIRECTLINE_SECRET"];
    if (!secret) throw new Error("DIRECTLINE_SECRET não configurado.");

    const res = await fetch(
      "https://directline.botframework.com/v3/directline/tokens/generate",
      { method: "POST", headers: { Authorization: `Bearer ${secret}` } },
    );

    if (!res.ok) {
      throw new Error(`Falha ao autenticar no Direct Line (HTTP ${res.status}).`);
    }

    const data = (await res.json()) as { token?: string };
    if (!data.token) throw new Error("Direct Line não retornou um token.");
    return { token: data.token };
  },
);
