import assert from "node:assert/strict";
import { advanceVisualizationRollover } from "../server/visualization-rollover";

const startsWithoutRetroactiveCredits = advanceVisualizationRollover({
  currentBalance: 0,
  baseLimit: 100,
  cap: 0,
  lastProcessedAt: null,
  now: new Date(2026, 6, 15),
  usagePeriods: [],
});
assert.equal(startsWithoutRetroactiveCredits.balance, 0);
assert.equal(startsWithoutRetroactiveCredits.periodsProcessed, 0);

const carriesUnusedAllowance = advanceVisualizationRollover({
  currentBalance: 0,
  baseLimit: 100,
  cap: 0,
  lastProcessedAt: new Date(2026, 5, 1),
  now: new Date(2026, 6, 1),
  usagePeriods: [{ month: 6, year: 2026, used: 35 }],
});
assert.equal(carriesUnusedAllowance.balance, 65);

const preservesAndAddsToExistingBank = advanceVisualizationRollover({
  currentBalance: 65,
  baseLimit: 100,
  cap: 0,
  lastProcessedAt: new Date(2026, 6, 1),
  now: new Date(2026, 7, 1),
  usagePeriods: [{ month: 7, year: 2026, used: 90 }],
});
assert.equal(preservesAndAddsToExistingBank.balance, 75);

const consumesBankedCredits = advanceVisualizationRollover({
  currentBalance: 40,
  baseLimit: 100,
  cap: 0,
  lastProcessedAt: new Date(2026, 6, 1),
  now: new Date(2026, 7, 1),
  usagePeriods: [{ month: 7, year: 2026, used: 125 }],
});
assert.equal(consumesBankedCredits.balance, 15);

const respectsConfiguredCapAcrossSkippedMonths = advanceVisualizationRollover({
  currentBalance: 0,
  baseLimit: 100,
  cap: 120,
  lastProcessedAt: new Date(2026, 4, 1),
  now: new Date(2026, 7, 1),
  usagePeriods: [],
});
assert.equal(respectsConfiguredCapAcrossSkippedMonths.balance, 120);
assert.equal(respectsConfiguredCapAcrossSkippedMonths.periodsProcessed, 3);

console.log("Visualization rollover regression passed");
