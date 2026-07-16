type QuoteActionArgs = {
  tenant: any;
  contactType?: string;
  contactPhone?: string;
  contactLink?: string;
  openForm: () => void;
};

function cleanPhone(phone: string) {
  return phone.replace(/[\(\)\-\s]/g, "");
}

export function getEmbedQuoteButtonText(tenant: any, fallback = "Get Free Quote") {
  return tenant?.embedCtaText || fallback;
}

export function runEmbedQuoteAction({
  tenant,
  contactType,
  contactPhone,
  contactLink,
  openForm,
}: QuoteActionArgs) {
  const destinationType =
    tenant?.embedQuoteDestinationType ||
    (contactType === "link" ? "link" : "email");
  const linkUrl = tenant?.embedCtaUrl || contactLink;
  const phone = tenant?.embedCtaPhone || contactPhone || tenant?.contactPhone || tenant?.phone;

  if (destinationType === "link" && linkUrl) {
    window.open(linkUrl, "_blank", "noopener,noreferrer");
    return;
  }

  if (destinationType === "phone" && phone) {
    window.open(`tel:${cleanPhone(phone)}`, "_self");
    return;
  }

  openForm();
}
