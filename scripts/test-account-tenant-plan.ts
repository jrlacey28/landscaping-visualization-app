import assert from "node:assert/strict";
import {
  CONTRACTOR_PLAN_ID,
  PROFESSIONAL_PLAN_ID,
  getManagedAccountClientPlan,
} from "../server/account-tenant-plan";

assert.deepEqual(
  getManagedAccountClientPlan(
    { planId: CONTRACTOR_PLAN_ID, status: "active" },
    { name: "Contractor", visualizationLimit: 200, embedAccess: true },
  ),
  { clientType: "contractor", isEnterprise: false, monthlyGenerationLimit: 200 },
);

assert.deepEqual(
  getManagedAccountClientPlan(
    { planId: PROFESSIONAL_PLAN_ID, status: "active" },
    { name: "Professional", visualizationLimit: 650, embedAccess: true },
  ),
  { clientType: "professional", isEnterprise: false, monthlyGenerationLimit: 650 },
);

assert.deepEqual(
  getManagedAccountClientPlan(
    { planId: "enterprise", status: "active" },
    { name: "Enterprise", visualizationLimit: -1, embedAccess: true },
  ),
  { clientType: "enterprise", isEnterprise: true, monthlyGenerationLimit: -1 },
);

assert.equal(
  getManagedAccountClientPlan(
    { planId: CONTRACTOR_PLAN_ID, status: "canceled" },
    { name: "Contractor", visualizationLimit: 200, embedAccess: true },
  ),
  null,
);

console.log("Account tenant plan regression passed");
