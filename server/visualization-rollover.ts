export interface VisualizationRolloverPeriod {
  month: number;
  year: number;
  used: number;
}

export interface VisualizationRolloverResult {
  balance: number;
  lastProcessedAt: Date;
  periodsProcessed: number;
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth() + 1, 1);
}

function periodKey(month: number, year: number) {
  return `${year}-${month}`;
}

function normalizeNonNegativeInteger(value: number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(Math.trunc(parsed), 0) : 0;
}

export function advanceVisualizationRollover({
  currentBalance,
  baseLimit,
  cap,
  lastProcessedAt,
  now,
  usagePeriods,
}: {
  currentBalance: number | null | undefined;
  baseLimit: number;
  cap: number | null | undefined;
  lastProcessedAt: Date | string | null | undefined;
  now: Date;
  usagePeriods: VisualizationRolloverPeriod[];
}): VisualizationRolloverResult {
  const monthlyAllowance = normalizeNonNegativeInteger(baseLimit);
  const maximumBalance = normalizeNonNegativeInteger(cap);
  let balance = normalizeNonNegativeInteger(currentBalance);

  if (maximumBalance > 0) {
    balance = Math.min(balance, maximumBalance);
  }

  const currentPeriod = startOfMonth(now);
  const parsedLastProcessedAt = lastProcessedAt ? new Date(lastProcessedAt) : null;
  if (!parsedLastProcessedAt || Number.isNaN(parsedLastProcessedAt.getTime())) {
    return {
      balance,
      lastProcessedAt: currentPeriod,
      periodsProcessed: 0,
    };
  }

  let rolloverPeriod = startOfMonth(parsedLastProcessedAt);
  if (rolloverPeriod >= currentPeriod || monthlyAllowance <= 0) {
    return {
      balance,
      lastProcessedAt: currentPeriod,
      periodsProcessed: 0,
    };
  }

  const usageByPeriod = new Map<string, number>();
  for (const period of usagePeriods) {
    const key = periodKey(period.month, period.year);
    usageByPeriod.set(
      key,
      (usageByPeriod.get(key) || 0) + normalizeNonNegativeInteger(period.used),
    );
  }

  let periodsProcessed = 0;
  while (rolloverPeriod < currentPeriod) {
    const used = usageByPeriod.get(
      periodKey(rolloverPeriod.getMonth() + 1, rolloverPeriod.getFullYear()),
    ) || 0;

    balance = Math.max(monthlyAllowance + balance - used, 0);
    if (maximumBalance > 0) {
      balance = Math.min(balance, maximumBalance);
    }

    rolloverPeriod = addMonth(rolloverPeriod);
    periodsProcessed += 1;
  }

  return {
    balance,
    lastProcessedAt: currentPeriod,
    periodsProcessed,
  };
}
