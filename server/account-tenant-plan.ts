export const CONTRACTOR_PLAN_ID = "price_1TcynuBY2SPm2HvO1Eri2ogI";
export const PROFESSIONAL_PLAN_ID = "price_1SGN4YBY2SPm2HvOrpREWCn1";

type SubscriptionLike = {
  planId?: string | null;
  status?: string | null;
};

type PlanLike = {
  name?: string | null;
  visualizationLimit?: number | null;
  embedAccess?: boolean | null;
};

export type ManagedAccountClientPlan = {
  clientType: "contractor" | "professional" | "enterprise" | "standard";
  isEnterprise: boolean;
  monthlyGenerationLimit: number;
};

export function getManagedAccountClientPlan(
  subscription: SubscriptionLike | null | undefined,
  plan: PlanLike | null | undefined,
): ManagedAccountClientPlan | null {
  if (!subscription || subscription.status !== "active") return null;

  const planId = String(subscription.planId || "").trim();
  const planName = String(plan?.name || "").trim().toLowerCase();
  const configuredLimit = Number(plan?.visualizationLimit);
  const limitOr = (fallback: number) =>
    Number.isInteger(configuredLimit) ? configuredLimit : fallback;

  if (planId === CONTRACTOR_PLAN_ID || planName === "contractor") {
    return {
      clientType: "contractor",
      isEnterprise: false,
      monthlyGenerationLimit: limitOr(200),
    };
  }

  if (
    planId === PROFESSIONAL_PLAN_ID ||
    planName === "professional" ||
    planName === "business pro" ||
    planName === "pro"
  ) {
    return {
      clientType: "professional",
      isEnterprise: false,
      monthlyGenerationLimit: limitOr(650),
    };
  }

  if (planId === "enterprise" || planName === "enterprise") {
    return {
      clientType: "enterprise",
      isEnterprise: true,
      monthlyGenerationLimit: limitOr(-1),
    };
  }

  if (plan?.embedAccess) {
    return {
      clientType: "standard",
      isEnterprise: false,
      monthlyGenerationLimit: limitOr(100),
    };
  }

  return null;
}
