type EnterpriseEmbedTenant = {
  userId?: number | null;
  isEnterprise?: boolean | null;
  active?: boolean | null;
};

type TeamAccess = {
  isMember: boolean;
  effectiveUserId: number;
};

export type EmbedVisitorAccessStatus = {
  canGenerate: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  limitEnabled: boolean;
  unlimitedAccountAccess?: boolean;
};

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
