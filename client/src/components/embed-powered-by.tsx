type EmbedPoweredByProps = {
  tenant?: any;
  className?: string;
};

export default function EmbedPoweredBy({ tenant, className = "" }: EmbedPoweredByProps) {
  const isWhiteLabel = tenant?.isEnterprise === true || tenant?.clientType === "enterprise";
  const brandingRequired = tenant?.embedBrandingRequired ?? !isWhiteLabel;

  if (!brandingRequired) return null;

  return (
    <div className={`flex justify-center ${className}`}>
      <a
        href="https://DreamBuilderAI.com"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center rounded-full border border-slate-200/90 bg-white/90 px-2 py-1 text-[9px] font-semibold leading-none tracking-tight text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
        aria-label="Powered by DreamBuilderAI.com"
      >
        <span>Powered by DreamBuilderAI.com</span>
      </a>
    </div>
  );
}
