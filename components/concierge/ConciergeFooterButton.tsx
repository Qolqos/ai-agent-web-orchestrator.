/**
 * AI Concierge — Footer Button (Portfolio Layout)
 * Source: ConciergeFooterButton.tsx
 * Focus: Persistent CTA -> widget open
 */
"use client";

import { MessageCircle } from "lucide-react";
import { useConciergeStore } from "@/lib/store/useConciergeStore";

export function ConciergeFooterButton() {
  const { toggleWidget } = useConciergeStore();

  return (
    <button
      onClick={() => toggleWidget(true)}
      aria-label="Open Capsule Concierge chat"
      className="inline-flex items-center gap-2 rounded-full bg-[var(--cf-highlight)] px-4 py-2 text-sm font-medium text-slate-900 hover:brightness-110 transition"
    >
      <MessageCircle className="h-4 w-4" />
      Chat with Concierge
    </button>
  );
}
