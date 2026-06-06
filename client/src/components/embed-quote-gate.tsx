import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmbedVisitorUsageStatus } from "@/hooks/use-embed-visitor-limit";

type EmbedQuoteGateProps = {
  status: EmbedVisitorUsageStatus | null;
  primaryColor: string;
  secondaryColor: string;
  buttonText?: string;
  onQuoteClick: () => void;
};

export default function EmbedQuoteGate({
  status,
  primaryColor,
  secondaryColor,
  buttonText,
  onQuoteClick,
}: EmbedQuoteGateProps) {
  return (
    <div className="mb-4 rounded-2xl border border-white/20 bg-white p-6 text-center shadow-lg">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Phone className="h-6 w-6 text-slate-700" />
      </div>
      <h2 className="text-xl font-semibold text-slate-950">
        {status?.quoteGateTitle || "Ready for a free quote?"}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
        {status?.quoteGateMessage ||
          "You've reached the free visualization limit. Request a quote to keep planning your project."}
      </p>
      <Button
        size="lg"
        className="mt-5 w-full max-w-sm font-semibold text-white shadow-lg"
        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
        onClick={onQuoteClick}
      >
        <Phone className="mr-2 h-5 w-5" />
        {buttonText || status?.quoteButtonText || "Get Free Quote"}
      </Button>
    </div>
  );
}
