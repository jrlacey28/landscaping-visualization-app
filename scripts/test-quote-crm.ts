import assert from "node:assert/strict";

import {
  buildQuoteCrmPayload,
  getQuoteCrmConfig,
  mergeQuoteCrmConfig,
  removePrivateQuoteCrmConfig,
  validateQuoteCrmWebhookUrl,
} from "../server/quote-crm";

const existingCustomizations = {
  enabledServices: { roofing: true },
  quoteCrm: { enabled: false, webhookUrl: "" },
};

const merged = mergeQuoteCrmConfig(existingCustomizations, {
  enabled: true,
  webhookUrl: "https://example.com/dreambuilder-quotes",
});

assert.deepEqual(merged.enabledServices, { roofing: true });
assert.deepEqual(getQuoteCrmConfig({ embedCustomizations: merged }), {
  enabled: true,
  webhookUrl: "https://example.com/dreambuilder-quotes",
});

const publicCustomizations = removePrivateQuoteCrmConfig(merged);
assert.equal("quoteCrm" in publicCustomizations, false);
assert.deepEqual(publicCustomizations.enabledServices, { roofing: true });

assert.equal(
  validateQuoteCrmWebhookUrl("https://hooks.example.com/quotes"),
  "https://hooks.example.com/quotes",
);
assert.throws(() => validateQuoteCrmWebhookUrl("http://hooks.example.com/quotes"), /HTTPS/);
assert.throws(() => validateQuoteCrmWebhookUrl("https://127.0.0.1/quotes"), /public HTTPS/);

const payload = buildQuoteCrmPayload({
  tenant: {
    id: 7,
    slug: "example-client",
    companyName: "Example Client",
    embedQuoteIncludeImages: true,
  },
  lead: {
    id: 42,
    service: "roofing-siding",
    firstName: "Jane",
    lastName: "Customer",
    email: "jane@example.com",
    generatedImageUrl: "https://example.com/generated.jpg",
  },
});

assert.equal(payload.event, "dreambuilder.quote.created");
assert.equal(payload.tenant.id, 7);
assert.equal(payload.quote.customer.email, "jane@example.com");
assert.equal(payload.quote.images?.generated, "https://example.com/generated.jpg");

const noImagePayload = buildQuoteCrmPayload({
  tenant: {
    id: 8,
    slug: "private-images",
    companyName: "Private Images",
    embedQuoteIncludeImages: false,
  },
  lead: {
    id: 43,
    email: "customer@example.com",
    generatedImageUrl: "https://example.com/hidden.jpg",
  },
});

assert.equal(noImagePayload.quote.images, null);

console.log("Quote CRM regression passed");
