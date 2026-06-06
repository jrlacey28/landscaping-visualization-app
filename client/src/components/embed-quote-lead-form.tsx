import QuoteLeadForm from "@/components/quote-lead-form";

type EmbedQuoteLeadFormProps = {
  tenant: any;
  service: string;
  selectedStyles: any;
  originalImageUrl?: string | null;
  generatedImageUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  onClose: () => void;
};

export default function EmbedQuoteLeadForm({
  tenant,
  service,
  selectedStyles,
  originalImageUrl,
  generatedImageUrl,
  primaryColor,
  secondaryColor,
  onClose,
}: EmbedQuoteLeadFormProps) {
  return (
    <QuoteLeadForm
      onClose={onClose}
      service={service}
      selectedStyles={selectedStyles}
      originalImageUrl={originalImageUrl}
      generatedImageUrl={generatedImageUrl}
      tenantId={tenant?.id || null}
      title={tenant?.embedQuoteFormTitle || undefined}
      description={tenant?.embedQuoteFormMessage || undefined}
      submitLabel={tenant?.embedCtaText || undefined}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      successRedirectUrl={tenant?.embedQuoteSuccessRedirectUrl || null}
    />
  );
}
