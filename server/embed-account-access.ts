type EnterpriseEmbedTenant = {
  userId?: number | null;
  isEnterprise?: boolean | null;
  active?: boolean | null;
};

type TeamAccess = {
  isMember: boolean;
  effectiveUserId: number;
};

type EmbedGenerationAccountingInput = {
  tenantOwnerUserId?: number | null;
  accountUserId?: number | null;
  authenticatedViewerUserId?: number | null;
};

export type EmbedGenerationAccounting = {
  ownerUserId: number;
  shouldTrackUserUsage: true;
};

export function resolveEmbedGenerationAccounting({
  tenantOwnerUserId,
  accountUserId,
}: EmbedGenerationAccountingInput): EmbedGenerationAccounting | null {
  // An embed can be opened while the browser is signed in to a different account.
  // Billing must follow the embed tenant/account and never the viewing session.
  const ownerUserId = tenantOwnerUserId || accountUserId;
  if (!ownerUserId) return null;

  return {
    ownerUserId,
    shouldTrackUserUsage: true,
  };
}

export type EmbedVisitorAccessStatus = {
  canGenerate: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  limitEnabled: boolean;
  unlimitedAccountAccess?: boolean;
};

type EmbedLimitTenant = {
  slug?: string | null;
  embedRequireQuoteAfterLimit?: boolean | null;
  embedVisitorLimit?: number | null;
};

export function getEmbedVisitorLimit(tenant: EmbedLimitTenant) {
  if (tenant.slug === "demo") return 3;

  return tenant.embedRequireQuoteAfterLimit
    ? Math.max(Number(tenant.embedVisitorLimit ?? 3), 0)
    : 0;
}

export async function hasUnlimitedEnterpriseEmbedAccess(
  authenticatedUserId: number | null | undefined,
  tenant: EnterpriseEmbedTenant,
  getUserTeamAccess: (userId: number) => Promise<TeamAccess>,
) {
  if (
    !authenticatedUserId ||
    !tenant.active ||
    !tenant.isEnterprise ||
    !tenant.userId
  ) {
    return false;
  }

  if (authenticatedUserId === tenant.userId) {
    return true;
  }

  const teamAccess = await getUserTeamAccess(authenticatedUserId);
  return teamAccess.isMember && teamAccess.effectiveUserId === tenant.userId;
}

export function buildUnlimitedEnterpriseEmbedStatus(): EmbedVisitorAccessStatus {
  return {
    canGenerate: true,
    currentUsage: 0,
    limit: 0,
    remaining: 0,
    limitEnabled: false,
    unlimitedAccountAccess: true,
  };
}

export function canUseEmbedCustomInstructions(
  hasBusinessProAccess: boolean,
  unlimitedAccountAccess: boolean | undefined,
) {
  return hasBusinessProAccess || unlimitedAccountAccess === true;
}
