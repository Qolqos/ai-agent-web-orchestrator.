/**
 * AI Concierge — Mobile Floating Action Button (Portfolio Layout)
 * Source: ConciergeMobileButton.tsx
 * Focus: Mobile-first entry point (FAB) -> widget open
 */
"use client";

import { MessageCircle } from "lucide-react";
import { useConciergeStore } from "@/lib/store/useConciergeStore";

export function ConciergeMobileButton() {
  const { toggleWidget } = useConciergeStore();

  return (
    <button
      onClick={() => toggleWidget(true)}
      aria-label="Open Capsule Concierge chat"
      className="fixed bottom-5 right-5 z-50 rounded-full bg-[var(--cf-highlight)] text-slate-900 p-4 shadow-lg hover:brightness-110 transition"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
