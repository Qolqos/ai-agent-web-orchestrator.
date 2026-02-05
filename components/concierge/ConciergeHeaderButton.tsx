/**
 * AI Concierge — Header Trigger Button (Portfolio Layout)
 * Source: ConciergeHeaderButton.tsx
 * Focus: UI trigger -> global widget state
 */
"use client";

import { MessageCircle } from "lucide-react";
import { useConciergeStore } from "@/lib/store/useConciergeStore";

export function ConciergeHeaderButton() {
  const { toggleWidget } = useConciergeStore();

  return (
    <button
      onClick={() => toggleWidget(true)}
      aria-label="Open Capsule Concierge chat"
      className="inline-flex items-center gap-2 rounded-full bg-[var(--cf-highlight)] px-4 py-2 text-sm font-medium text-slate-900 hover:brightness-110 transition"
    >
      <MessageCircle className="h-4 w-4" />
      Ask Concierge
    </button>
  );
}
