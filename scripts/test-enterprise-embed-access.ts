import assert from "node:assert/strict";
import {
  buildUnlimitedEnterpriseEmbedStatus,
  canUseEmbedCustomInstructions,
  getEmbedVisitorLimit,
  hasUnlimitedEnterpriseEmbedAccess,
} from "../server/embed-account-access";

const enterpriseTenant = {
  userId: 10,
  isEnterprise: true,
  active: true,
};

const ownerHasAccess = await hasUnlimitedEnterpriseEmbedAccess(
  10,
  enterpriseTenant,
  async () => ({ isMember: false, effectiveUserId: 10 }),
);
assert.equal(ownerHasAccess, true, "enterprise owner should bypass the visitor limit");

const memberHasAccess = await hasUnlimitedEnterpriseEmbedAccess(
  22,
  enterpriseTenant,
  async () => ({ isMember: true, effectiveUserId: 10 }),
);
assert.equal(memberHasAccess, true, "active member of the enterprise owner's team should bypass the visitor limit");

const unrelatedMemberHasAccess = await hasUnlimitedEnterpriseEmbedAccess(
  23,
  enterpriseTenant,
  async () => ({ isMember: true, effectiveUserId: 99 }),
);
assert.equal(unrelatedMemberHasAccess, false, "member of another account must not bypass the visitor limit");

const publicVisitorHasAccess = await hasUnlimitedEnterpriseEmbedAccess(
  null,
  enterpriseTenant,
  async () => ({ isMember: false, effectiveUserId: 0 }),
);
assert.equal(publicVisitorHasAccess, false, "public visitors must remain subject to the configured limit");

const standardOwnerHasAccess = await hasUnlimitedEnterpriseEmbedAccess(
  10,
  { ...enterpriseTenant, isEnterprise: false },
  async () => ({ isMember: false, effectiveUserId: 10 }),
);
assert.equal(standardOwnerHasAccess, false, "standard accounts must not receive the enterprise bypass");

assert.deepEqual(buildUnlimitedEnterpriseEmbedStatus(), {
  canGenerate: true,
  currentUsage: 0,
  limit: 0,
  remaining: 0,
  limitEnabled: false,
  unlimitedAccountAccess: true,
});

assert.equal(
  canUseEmbedCustomInstructions(false, true),
  true,
  "enterprise owners and team members with unlimited embed access should receive custom instructions",
);
assert.equal(canUseEmbedCustomInstructions(false, false), false);
assert.equal(canUseEmbedCustomInstructions(true, false), true);

assert.equal(
  getEmbedVisitorLimit({ slug: "demo", embedRequireQuoteAfterLimit: false, embedVisitorLimit: 99 }),
  3,
  "the public embed demo must always be capped at three successful generations",
);
assert.equal(
  getEmbedVisitorLimit({ slug: "contractor", embedRequireQuoteAfterLimit: true, embedVisitorLimit: 4 }),
  4,
  "contractor embeds should retain their configured visitor limit",
);

console.log("Enterprise embed account access regression passed");
