import assert from "node:assert/strict";

import { resolveEmbedQuoteAction } from "../client/src/lib/embed-quote";

assert.deepEqual(
  resolveEmbedQuoteAction({
    tenant: { embedQuoteDestinationType: "link", embedCtaUrl: "https://example.com/quote" },
    contactType: "phone",
    contactPhone: "555-0100",
    contactLink: "",
  }),
  { type: "link", url: "https://example.com/quote" },
  "the enterprise external-link destination should open the configured page",
);

assert.deepEqual(
  resolveEmbedQuoteAction({
    tenant: { embedQuoteDestinationType: "email" },
    contactType: "link",
    contactPhone: "",
    contactLink: "https://legacy.example.com",
  }),
  { type: "form" },
  "the tenant quote flow must remain authoritative over legacy embed parameters",
);

assert.deepEqual(
  resolveEmbedQuoteAction({
    tenant: {},
    contactType: "link",
    contactPhone: "",
    contactLink: "https://legacy.example.com",
  }),
  { type: "link", url: "https://legacy.example.com" },
  "standard embeds should retain legacy link support",
);

assert.deepEqual(
  resolveEmbedQuoteAction({
    tenant: { embedQuoteDestinationType: "phone", embedCtaPhone: "(555) 010-0200" },
    contactType: "phone",
    contactPhone: "",
    contactLink: "",
  }),
  { type: "phone", phone: "(555) 010-0200" },
);

assert.deepEqual(
  resolveEmbedQuoteAction({
    tenant: { embedQuoteDestinationType: "link", embedCtaUrl: "" },
    contactType: "phone",
    contactPhone: "",
    contactLink: "",
  }),
  { type: "form" },
  "a missing external URL should fail safely to the lead form",
);

console.log("Embed quote action regression passed");
