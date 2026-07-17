import net from "node:net";

import type { Lead, Tenant } from "@shared/schema";

export type QuoteCrmConfig = {
  enabled: boolean;
  webhookUrl: string;
};

type QuoteCrmDeliveryResult = {
  attempted: boolean;
  sent: boolean;
  error?: string;
};

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, any>) }
    : {};
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;

  return (
    parts[0] === 0 ||
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] >= 224
  );
}

export function validateQuoteCrmWebhookUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("CRM webhook URL must be a valid URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("CRM webhook URL must use HTTPS");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const ipVersion = net.isIP(hostname);
  const privateIpv6 = ipVersion === 6 && (
    hostname === "::1" ||
    hostname.startsWith("fc") ||
    hostname.startsWith("fd") ||
    hostname.startsWith("fe8") ||
    hostname.startsWith("fe9") ||
    hostname.startsWith("fea") ||
    hostname.startsWith("feb")
  );

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    (ipVersion === 4 && isPrivateIpv4(hostname)) ||
    privateIpv6
  ) {
    throw new Error("CRM webhook URL must use a public HTTPS address");
  }

  return parsed.toString();
}

export function getQuoteCrmConfig(tenant: Pick<Tenant, "embedCustomizations"> | any): QuoteCrmConfig {
  const customizations = asRecord(tenant?.embedCustomizations);
  const quoteCrm = asRecord(customizations.quoteCrm);

  return {
    enabled: quoteCrm.enabled === true,
    webhookUrl: typeof quoteCrm.webhookUrl === "string" ? quoteCrm.webhookUrl.trim() : "",
  };
}

export function mergeQuoteCrmConfig(
  embedCustomizations: unknown,
  config: QuoteCrmConfig,
) {
  return {
    ...asRecord(embedCustomizations),
    quoteCrm: {
      enabled: config.enabled,
      webhookUrl: config.webhookUrl,
    },
  };
}

export function removePrivateQuoteCrmConfig(embedCustomizations: unknown) {
  const customizations = asRecord(embedCustomizations);
  delete customizations.quoteCrm;
  return customizations;
}

export function buildQuoteCrmPayload({
  tenant,
  lead,
  test = false,
}: {
  tenant: Tenant | any;
  lead: Lead | any;
  test?: boolean;
}) {
  const includeImages = tenant?.embedQuoteIncludeImages !== false;

  return {
    event: test ? "dreambuilder.quote.test" : "dreambuilder.quote.created",
    test,
    sentAt: new Date().toISOString(),
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      companyName: tenant.companyName,
    },
    quote: {
      id: lead.id ?? null,
      createdAt: lead.createdAt ?? new Date().toISOString(),
      service: lead.service ?? null,
      customer: {
        firstName: lead.firstName ?? "",
        lastName: lead.lastName ?? "",
        email: lead.email ?? "",
        phone: lead.phone ?? null,
        location: lead.location ?? null,
      },
      project: {
        details: lead.projectDetails ?? null,
        timeline: lead.timeline ?? null,
        selectedStyles: lead.selectedStyles ?? null,
      },
      images: includeImages
        ? {
            original: lead.originalImageUrl ?? null,
            generated: lead.generatedImageUrl ?? null,
          }
        : null,
    },
  };
}

export async function sendQuoteLeadToCrm({
  tenant,
  lead,
  test = false,
  webhookUrl,
}: {
  tenant: Tenant | any;
  lead: Lead | any;
  test?: boolean;
  webhookUrl?: string;
}): Promise<QuoteCrmDeliveryResult> {
  const configured = getQuoteCrmConfig(tenant);
  const enabled = test || configured.enabled;

  if (!enabled) {
    return { attempted: false, sent: false };
  }

  let resolvedUrl: string;
  try {
    resolvedUrl = validateQuoteCrmWebhookUrl(webhookUrl ?? configured.webhookUrl);
  } catch (error) {
    return {
      attempted: true,
      sent: false,
      error: error instanceof Error ? error.message : "CRM webhook URL is invalid",
    };
  }

  if (!resolvedUrl) {
    return { attempted: false, sent: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(resolvedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DreamBuilder-Quote-Webhook/1.0",
      },
      body: JSON.stringify(buildQuoteCrmPayload({ tenant, lead, test })),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`CRM returned HTTP ${response.status}`);
    }

    return { attempted: true, sent: true };
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "CRM webhook timed out"
      : error instanceof Error
        ? error.message
        : "CRM webhook failed";

    return { attempted: true, sent: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
