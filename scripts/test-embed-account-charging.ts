import assert from "node:assert/strict";
import { resolveEmbedGenerationAccounting } from "../server/embed-account-access";

const contractorAccounting = resolveEmbedGenerationAccounting({
  tenantOwnerUserId: 34,
  accountUserId: 34,
  authenticatedViewerUserId: 1,
});
assert.deepEqual(
  contractorAccounting,
  { ownerUserId: 34, shouldTrackUserUsage: true },
  "a contractor embed must charge its owning account, not the signed-in viewer",
);

const professionalAccounting = resolveEmbedGenerationAccounting({
  tenantOwnerUserId: 52,
  accountUserId: 52,
  authenticatedViewerUserId: 1,
});
assert.deepEqual(
  professionalAccounting,
  { ownerUserId: 52, shouldTrackUserUsage: true },
  "a professional embed must charge its owning account",
);

const enterpriseAccounting = resolveEmbedGenerationAccounting({
  tenantOwnerUserId: 61,
  accountUserId: 61,
  authenticatedViewerUserId: 77,
});
assert.deepEqual(
  enterpriseAccounting,
  { ownerUserId: 61, shouldTrackUserUsage: true },
  "an enterprise embed used by a team member must charge the enterprise owner",
);

const tenantOwnerTakesPriority = resolveEmbedGenerationAccounting({
  tenantOwnerUserId: 34,
  accountUserId: 1,
  authenticatedViewerUserId: 1,
});
assert.equal(
  tenantOwnerTakesPriority?.ownerUserId,
  34,
  "the canonical tenant owner must take priority over stale URL or viewer account data",
);

const accountFallback = resolveEmbedGenerationAccounting({
  tenantOwnerUserId: null,
  accountUserId: 34,
  authenticatedViewerUserId: 1,
});
assert.deepEqual(
  accountFallback,
  { ownerUserId: 34, shouldTrackUserUsage: true },
  "an account embed may fall back to its explicit account owner while its tenant is being provisioned",
);

assert.equal(
  resolveEmbedGenerationAccounting({
    tenantOwnerUserId: null,
    accountUserId: null,
    authenticatedViewerUserId: 1,
  }),
  null,
  "a viewer session by itself must never become the embed charge target",
);

console.log("Embed account charging regression passed");
