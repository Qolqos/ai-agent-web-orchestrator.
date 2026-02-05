/**
 * AI Concierge — Backend API Route (Portfolio Layout)
 * Source: app/api/concierge/route.ts (rebuilt from curated excerpt)
 *
 * NOTE: The PDFs provided were excerpted/truncated for portfolio display.
 * This file reconstructs a *compilable* scaffold that matches the excerpt’s structure.
 * You must wire your own implementations for the TODO helpers/types/constants below.
 */
import type { NextRequest } from "next/server";

/* ----------------------------
   TODO: project-specific types
----------------------------- */
type ChatMessage = { role: string; content: string; name?: string; tool_call_id?: string };
type CartItem = { capsuleId: string; quantity: number; price: number };
type ConciergeResponse = { text: string; bundleOffer?: unknown; navigationUrl?: string | null };
type ApiErrorResponse = { error: string; hint?: string };
type BundleOffer = unknown;
type OpenAIResponse = any;

/* ----------------------------
   TODO: project-specific deps
----------------------------- */
// Replace these placeholders with your real implementations/imports.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_TOKENS = Number(process.env.CONCIERGE_MAX_TOKENS || 700);
const SYSTEM_PROMPT = process.env.CONCIERGE_SYSTEM_PROMPT || "";
const TOOLS: unknown[] = [];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sanitizeString(v: unknown, maxLen: number) {
  const s = String(v ?? "");
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function getClientIp(_req: NextRequest) {
  return "0.0.0.0";
}

const conciergeRateLimiter = {
  check: (_ip: string) => ({ allowed: true, remaining: 999, resetAfter: 0 }),
};

const rateLimiters = {
  concierge: async (_ip: string) => ({ success: true, remaining: 999, reset: 0 }),
};

const Logger = {
  error: (_msg: string, _e: Error) => {},
};

async function handleToolCall(_name: string, _args: Record<string, unknown>) {
  return { success: true };
}

/* ---------------------------------------------------------
  1) Request validation + rate limiting + sanitization
---------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting (10 requests per minute per IP)
    const clientIp = getClientIp(req);
    const rateLimit = await rateLimiters.concierge(clientIp);

    if (!rateLimit.success) {
      return json(
        {
          ok: false,
          error: "Rate limit exceeded. Please try again later.",
          remaining: rateLimit.remaining,
          resetAfter: rateLimit.reset,
        },
        429
      );
    }

    const localLimit = conciergeRateLimiter.check(clientIp);
    if (!localLimit.allowed) {
      return json(
        {
          ok: false,
          error: "Too many rapid concierge requests. Please wait a few seconds.",
          remaining: localLimit.remaining,
          resetAfter: Math.ceil(localLimit.resetAfter / 1000),
        },
        429
      );
    }

    // Validate env & imports early
    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
    if (!SYSTEM_PROMPT) throw new Error("SYSTEM_PROMPT not found (check '@/lib/concierge/prompt')");
    if (!Array.isArray(TOOLS)) throw new Error("TOOLS must be an array (check '@/lib/concierge/prompt')");

    const body = await req.json().catch(() => ({} as any));

    // Validate request body
    if (!Array.isArray((body as any)?.messages)) {
      return json({ ok: false, error: "Messages array is required" }, 400);
    }

    // Sanitize messages - prevent prompt injection
    const userMessages = ((body as any).messages as ChatMessage[]).map((msg) => ({
      ...msg,
      content: sanitizeString((msg as any).content, 2000), // Limit message length
      role: ["system", "user", "assistant", "tool"].includes((msg as any).role) ? (msg as any).role : "user",
    }));

    // Validate messages don't exceed limits
    if (userMessages.length > 50) {
      return json({ ok: false, error: "Message history too long (max 50)" }, 400);
    }

    // Sanitize cart items
    const cartItems: CartItem[] = Array.isArray((body as any)?.cartItems)
      ? ((body as any).cartItems as unknown[]).map((item: unknown) => {
          const itemData = item as Record<string, unknown>;
          return {
            capsuleId: sanitizeString((itemData.capsuleId as string) || "", 100),
            quantity: typeof itemData.quantity === "number" ? Math.max(1, itemData.quantity) : 1,
            price: typeof itemData.price === "number" ? Math.max(0, itemData.price) : 0,
          };
        })
      : []; // Cart context from widget

    // Store cart context in global for handleToolCall access
    (globalThis as any).__cartContext = { items: cartItems };

    /* ---------------------------------------------------------
      2) Tool-call loop: execute tools, then second-pass completion
    ---------------------------------------------------------- */

    // prepend system
    const messages: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }, ...userMessages];

    // First pass (let model decide tools)
    const first = (await callOpenAI(messages, "auto")) as OpenAIResponse;
    const choice = first?.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      const toolResults: ChatMessage[] = [];
      let bundleOfferFromTools: BundleOffer | null = null;

      for (const tc of toolCalls) {
        const name = tc.function?.name as string;
        const tool_call_id = tc.id as string;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function?.arguments || "{}");
        } catch {}

        const result = await handleToolCall(name, args);

        // Capture bundle offer if recommend_bundles was called
        if (name === "recommend_bundles" && (result as any).discountOffer) {
          bundleOfferFromTools = (result as any).discountOffer as BundleOffer;
        }

        toolResults.push({
          role: "tool",
          name,
          tool_call_id,
          content: JSON.stringify(result),
        });
      }

      // Second pass for final text
      const second = await callOpenAI([...messages, choice.message as ChatMessage, ...toolResults], "none");
      const finalText = second?.choices?.[0]?.message?.content || "OK.";

      // Check if any tool results included navigation
      let navigationUrl: string | null = null;
      for (const result of toolResults) {
        if (result.name === "navigate_site") {
          const parsed = JSON.parse(result.content);
          if (parsed.success && parsed.url) {
            navigationUrl = parsed.url;
            break;
          }
        }
      }

      return json({
        text: finalText,
        bundleOffer: bundleOfferFromTools,
        navigationUrl,
      } satisfies ConciergeResponse);
    }

    const text = choice?.message?.content || "OK.";
    return json({ text } as ConciergeResponse);
  } catch (e: unknown) {
    Logger.error("Concierge POST error", e instanceof Error ? e : new Error(String(e)));
    return json(
      {
        error: "Service error",
        hint: "Failed to process concierge request. Please try again.",
      } satisfies ApiErrorResponse,
      500
    );
  }
}

/* ---------------------------------------------------------
  3) OpenAI call helper: timeout + retry/backoff + error surfacing
---------------------------------------------------------- */
async function callOpenAI(messages: ChatMessage[], toolChoice: "auto" | "none"): Promise<OpenAIResponse> {
  return retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout for OpenAI

      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            messages,
            tools: TOOLS as unknown[],
            tool_choice: toolChoice,
            max_tokens: MAX_TOKENS,
            temperature: 0.6,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          await res.text().catch(() => "");
          Logger.error("OpenAI API error", new Error(`HTTP ${res.status}`));
          const error: any = new Error(`OpenAI ${res.status}`);
          error.status = res.status;
          throw error;
        }

        return (await res.json()) as OpenAIResponse;
      } catch (error: any) {
        clearTimeout(timeout);
        if (error instanceof Error && (error as any).name === "AbortError") {
          throw new Error("OpenAI request timeout after 30s");
        }
        throw error;
      }
    },
    {
      maxAttempts: 2,
      initialDelayMs: 1000,
      retryableStatusCodes: [408, 429, 500, 502, 503],
    }
  );
}

/* ----------------------------
   Simple retry helper (TODO)
----------------------------- */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts: number; initialDelayMs: number; retryableStatusCodes: number[] }
): Promise<T> {
  let attempt = 0;
  let delay = opts.initialDelayMs;

  // Minimal retry loop (keeps structure similar to excerpt)
  while (true) {
    attempt += 1;
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.status;
      const shouldRetry =
        attempt < opts.maxAttempts && (typeof status === "number" ? opts.retryableStatusCodes.includes(status) : true);

      if (!shouldRetry) throw err;

      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}
