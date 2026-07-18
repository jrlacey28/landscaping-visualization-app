type QuoteActionArgs = {
  tenant: any;
  contactType?: string;
  contactPhone?: string;
  contactLink?: string;
  openForm: () => void;
};

export type ResolvedEmbedQuoteAction =
  | { type: "link"; url: string }
  | { type: "phone"; phone: string }
  | { type: "form" };

function cleanPhone(phone: string) {
  return phone.replace(/[\(\)\-\s]/g, "");
}

export function getEmbedQuoteButtonText(tenant: any, fallback = "Get Free Quote") {
  return tenant?.embedCtaText || fallback;
}

export function resolveEmbedQuoteAction({
  tenant,
  contactType,
  contactPhone,
  contactLink,
}: Omit<QuoteActionArgs, "openForm">): ResolvedEmbedQuoteAction {
  const configuredDestination = String(tenant?.embedQuoteDestinationType || "").trim().toLowerCase();
  const destinationType = configuredDestination || (contactType === "link" ? "link" : "email");
  const linkUrl = String(tenant?.embedCtaUrl || contactLink || "").trim();
  const phone = String(tenant?.embedCtaPhone || contactPhone || tenant?.contactPhone || tenant?.phone || "").trim();

  if (destinationType === "link" && linkUrl) {
    return { type: "link", url: linkUrl };
  }

  if (destinationType === "phone" && phone) {
    return { type: "phone", phone };
  }

  return { type: "form" };
}

export function runEmbedQuoteAction({
  tenant,
  contactType,
  contactPhone,
  contactLink,
  openForm,
}: QuoteActionArgs) {
  const action = resolveEmbedQuoteAction({ tenant, contactType, contactPhone, contactLink });

  if (action.type === "link") {
    const openedWindow = window.open(action.url, "_blank");
    if (openedWindow) openedWindow.opener = null;
    return;
  }

  if (action.type === "phone") {
    window.open(`tel:${cleanPhone(action.phone)}`, "_self");
    return;
  }

  openForm();
}
