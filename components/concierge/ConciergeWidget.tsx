/**
 * AI Concierge — Embedded Support Widget (Portfolio Layout)
 * Source: ConciergeWidget.tsx (rebuilt from curated excerpt)
 *
 * NOTE: The PDFs provided were excerpted/truncated for portfolio display.
 * This file reconstructs a *working, compilable* widget using the visible excerpt
 * plus small glue code (email submit handler, loading handling, missing closing JSX).
 */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Trash2, Mail, ExternalLink, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConciergeStore } from "@/lib/store/useConciergeStore";
import { useCartStore } from "@/lib/store/useCartStore";
import type { ConciergeMessage } from "@/types/concierge";

/* ---------------------------------------------------------
  1) Message parsing: inline navigation links in responses
---------------------------------------------------------- */

/**
 * Parse message content for navigation links and bundle offers
 * Navigation marker format:
 *   [nav:/capsules/category/business-brand|Business Capsules]
 */
function parseMessageContent(content: string) {
  const navRegex = /\[nav:([^\|]+)\|([^\]]+)\]/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  content.replace(navRegex, (match, url, label, index) => {
    if (index > lastIndex) {
      parts.push(content.substring(lastIndex, index));
    }

    parts.push(
      <a
        key={`nav-${index}`}
        href={url}
        className="underline text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
      >
        {label}
        <ExternalLink className="h-3 w-3" />
      </a>
    );

    lastIndex = index + match.length;
    return match;
  });

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 1 ? parts : content;
}

/* ---------------------------------------------------------
  2) Core: send() -> POST /api/concierge + nav/bundle handling
---------------------------------------------------------- */

export function ConciergeWidget() {
  const router = useRouter();
  const {
    sessionId,
    messages,
    isOpen,
    isLoading,
    addMessage,
    toggleWidget,
    setLoading,
    clearHistory,
    setUserEmail,
  } = useConciergeStore();

  const { items: cartItems = [] } = useCartStore();

  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  const [activeBundle, setActiveBundle] = useState<any>(null);
  const [bundleTimer, setBundleTimer] = useState<number>(0);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Timer for bundle expiration countdown
  useEffect(() => {
    if (!activeBundle?.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, activeBundle.expiresAt - Date.now());
      setBundleTimer(Math.floor(remaining / 1000));
      if (remaining <= 0) {
        setActiveBundle(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBundle?.expiresAt]);

  const handleEmailSubmit = () => {
    const value = email.trim();
    if (!value) return;
    setUserEmail(value);
    setShowEmailPrompt(false);
  };

  const send = async () => {
    const q = input.trim();
    if (!q) return;

    const userMsg: ConciergeMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: Date.now(),
    };

    const conversationForApi = [...messages, userMsg].slice(-12);
    addMessage(userMsg);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationForApi,
          sessionId,
          userEmail: email || undefined,
          cartItems: cartItems.map((item: any) => ({
            id: item.id,
            capsuleId: item.capsuleId,
            quantity: item.quantity || 1,
            price: item.price || 0,
          })),
        }),
      });

      const json = await res.json();

      const assistantContent =
        json.text || json.content || "Hmm, I hit a snag. Try rephrasing that?";

      const assistantMsg: ConciergeMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: assistantContent,
        timestamp: Date.now(),
        metadata: json.metadata,
      };

      addMessage(assistantMsg);

      // Handle navigation if the AI decided to navigate
      if (json.navigationUrl) {
        setTimeout(() => {
          router.push(json.navigationUrl);
        }, 800);
      }

      // Handle bundle offer if returned
      if (json.bundleOffer) {
        setActiveBundle({
          ...json.bundleOffer,
          expiresAt: Date.now() + (json.bundleOffer.expiresIn || 300) * 1000,
        });
      }

      // Soft-prompt for email capture (lightweight lead capture)
      if (!email && messages.length > 6 && Math.random() > 0.5) {
        setShowEmailPrompt(true);
      }
    } catch (error) {
      const errorMsg: ConciergeMessage = {
        id: `msg-${Date.now() + 2}`,
        role: "assistant",
        content: "Network error. Please try again.",
        timestamp: Date.now(),
      };
      addMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
    3) UI shell: floating button + chat container
  ---------------------------------------------------------- */

  return (
    <>
      {/* Floating launcher (shows on all viewports) */}
      <button
        aria-label="Open Capsule Concierge"
        onClick={() => toggleWidget(true)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-[var(--cf-highlight)] text-slate-900 p-4 shadow-lg hover:brightness-110 transition"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(92vw,380px)] rounded-2xl border border-white/10 bg-white/95 backdrop-blur shadow-2xl text-slate-900 overflow-hidden flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
            <div className="text-sm font-semibold">Capsule Concierge</div>
            <div className="flex gap-1">
              <button
                aria-label="Clear history"
                onClick={() => clearHistory()}
                title="Clear chat history"
                className="rounded-full p-1 hover:bg-slate-200 transition"
              >
                <Trash2 className="h-4 w-4 text-slate-600" />
              </button>
              <button
                aria-label="Close chat"
                onClick={() => toggleWidget(false)}
                className="rounded-full p-1 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="h-[360px] overflow-y-auto p-3 space-y-3 flex-1 bg-gradient-to-b from-white/50 to-white/30"
          >
            {messages.map((m: any) => (
              <div
                key={m.id}
                className={`text-sm leading-relaxed rounded-xl px-3 py-2 max-w-[85%] ${
                  m.role === "assistant"
                    ? "bg-slate-100 text-slate-900"
                    : "bg-[var(--cf-highlight)] text-slate-900 ml-auto"
                }`}
              >
                {typeof m.content === "string" ? parseMessageContent(m.content) : m.content}
              </div>
            ))}

            {isLoading && <div className="text-xs text-slate-500 px-2 italic">Thinking…</div>}
          </div>

          {/* Bundle offer */}
          {activeBundle && (
            <div className="border-t border-amber-200 p-3 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-sm text-amber-900">■ Bundle Offer</div>
                <div className="flex items-center gap-1 text-xs font-mono tabular-nums text-red-600">
                  <Clock className="h-3 w-3" />
                  {Math.floor(bundleTimer / 60)}:{(bundleTimer % 60).toString().padStart(2, "0")}
                </div>
              </div>

              <div className="space-y-2 mb-2">
                <div className="text-xs text-slate-700">
                  {activeBundle.members && activeBundle.members.length > 0 && (
                    <>
                      <div className="font-medium mb-1">
                        {activeBundle.members.map((m: any, i: number) => (
                          <span key={m.slug || i}>
                            {m.title}
                            {i < activeBundle.members.length - 1 ? " + " : ""}
                          </span>
                        ))}
                      </div>
                      <div className="text-slate-600">
                        <span className="line-through">${activeBundle.totalPrice}</span>
                        {" → "}
                        <span className="font-bold text-amber-900">${activeBundle.bundlePrice}</span>
                        <span className="text-green-600 ml-1">Save ${activeBundle.savings}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  // TODO: wire into cart add flow with token
                  setActiveBundle(null);
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium py-1 rounded transition"
              >
                Claim Bundle
              </button>
            </div>
          )}

          {/* Email capture */}
          {showEmailPrompt && (
            <div className="border-t border-slate-200 p-2 bg-blue-50 flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEmailSubmit();
                }}
                placeholder="your@email.com"
                className="flex-1 rounded-lg border border-blue-200 px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <button
                onClick={handleEmailSubmit}
                className="rounded-lg bg-blue-600 text-white px-2 py-1 text-xs font-medium hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          )}

          {/* Composer */}
          <div className="border-t border-slate-200 p-2 flex items-center gap-2 bg-gradient-to-r from-slate-50 to-blue-50 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Describe your goal…"
              className="flex-1 rounded-xl border-2 border-[var(--cf-highlight)] bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 outline-none focus:ring-2 focus:ring-[var(--cf-highlight)] focus:ring-offset-1 transition"
            />
            <button
              onClick={send}
              disabled={isLoading || !input.trim()}
              className="rounded-xl bg-[var(--cf-highlight)] text-slate-900 p-2 hover:brightness-110 disabled:opacity-60 transition font-semibold"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
