import { Phone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmbedVisitorUsageStatus } from "@/hooks/use-embed-visitor-limit";

type EmbedQuoteGateProps = {
  status: EmbedVisitorUsageStatus | null;
  primaryColor: string;
  secondaryColor: string;
  buttonText?: string;
  onQuoteClick: () => void;
  onClose?: () => void;
};

export default function EmbedQuoteGate({
  status,
  primaryColor,
  buttonText,
  onQuoteClick,
  onClose,
}: EmbedQuoteGateProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="embed-quote-gate-title"
        className="relative w-full max-w-lg rounded-2xl border border-white/30 bg-white/95 p-5 text-center shadow-2xl"
      >
        {onClose && (
          <button
            type="button"
            aria-label="Close quote prompt"
            className="absolute right-3 top-3 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Phone className="h-6 w-6 text-slate-700" />
        </div>
        <h2 id="embed-quote-gate-title" className="text-xl font-semibold text-slate-950">
          {status?.quoteGateTitle || "Ready for a free quote?"}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          {status?.quoteGateMessage ||
            "You've reached the free visualization limit. Request a quote to keep planning your project."}
        </p>
        <Button
          size="lg"
          className="mt-5 w-full max-w-sm font-semibold text-white shadow-lg"
          style={{ backgroundColor: primaryColor }}
          onClick={onQuoteClick}
        >
          <Phone className="mr-2 h-5 w-5" />
          {buttonText || status?.quoteButtonText || "Get Free Quote"}
        </Button>
      </div>
    </div>
  );
}
