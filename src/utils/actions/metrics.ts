import { Financial, StockMetricsData } from "@/types/common";

export const calcRatio = (
  a: number | null,
  b: number | null,
  options?: { allowZeroB?: boolean }
): number | null => {
  if (a == null || b == null) return null;
  if (!options?.allowZeroB && b === 0) return null;
  const result = a / b;
  return isFinite(result) && !isNaN(result) ? result : null;
};

export const avg = (arr: number[]): number | null =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

export const filterNonNullNumbers = (values: (number | null)[]): number[] =>
  values.filter((v): v is number => v !== null && !isNaN(v));

export const calculateFinancialRatios = (financial: Financial | null) => {
  if (!financial)
    return {
      grossProfit: null,
      netIncome: null,
      grossMargin: null,
      netMargin: null,
      assetTurnover: null,
      currentRatio: null,
      quickRatio: null,
      interestCoverage: null,
    };

  const grossProfit = financial.total_revenue - financial.cost_of_revenue;
  const netIncome = grossProfit - financial.other_expenses;

  return {
    grossProfit,
    netIncome,
    grossMargin: calcRatio(grossProfit, financial.total_revenue),
    netMargin: calcRatio(netIncome, financial.total_revenue),
    assetTurnover: calcRatio(financial.total_revenue, financial.total_assets),
    currentRatio: calcRatio(financial.current_assets, financial.current_liabilities),
    quickRatio: calcRatio(
      financial.current_assets - financial.inventory,
      financial.current_liabilities
    ),
    interestCoverage: calcRatio(financial.ebit, financial.interest_expenses),
  };
};

export const calculateAverageMetrics = (metrics: StockMetricsData[] | null) => {
  if (!metrics)
    return {
      avgROE: null,
      avgROA: null,
      avgEPS: null,
      avgPayout: null,
      avgDividendYield: null,
    };

  return {
    avgROE: avg(
      filterNonNullNumbers(metrics.map((m) => Number(m.return_on_equity)))
    ),
    avgROA: avg(
      filterNonNullNumbers(metrics.map((m) => Number(m.return_on_assets)))
    ),
    avgEPS: avg(filterNonNullNumbers(metrics.map((m) => Number(m.eps)))),
    avgPayout: avg(
      filterNonNullNumbers(metrics.map((m) => Number(m.payout_ratio)))
    ),
    avgDividendYield: avg(
      filterNonNullNumbers(metrics.map((m) => Number(m.trailing_annual_dividend_rate)))
    ),
  };
};

export const calculateAverageFinancialRatios = (financials: Financial[] | null) => {
  if (!financials)
    return {
      avgAssetTurnover: null,
      avgCurrentRatio: null,
      avgQuickRatio: null,
      avgInterestCoverage: null,
      avgGrossMargin: null,
      avgNetMargin: null,
    };

  const assetTurnovers = financials.map((f) =>
    calcRatio(f.total_revenue, f.total_assets)
  );
  const currentRatios = financials.map((f) =>
    calcRatio(f.current_assets, f.current_liabilities)
  );
  const quickRatios = financials.map((f) =>
    calcRatio(f.current_assets - f.inventory, f.current_liabilities)
  );
  const interestCoverages = financials.map((f) =>
    calcRatio(f.ebit, f.interest_expenses)
  );
  const grossMargins = financials.map((f) =>
    calcRatio(f.total_revenue - f.cost_of_revenue, f.total_revenue)
  );
  const netMargins = financials.map((f) =>
    calcRatio(
      f.total_revenue - f.cost_of_revenue - f.other_expenses,
      f.total_revenue
    )
  );

  return {
    avgAssetTurnover: avg(filterNonNullNumbers(assetTurnovers)),
    avgCurrentRatio: avg(filterNonNullNumbers(currentRatios)),
    avgQuickRatio: avg(filterNonNullNumbers(quickRatios)),
    avgInterestCoverage: avg(filterNonNullNumbers(interestCoverages)),
    avgGrossMargin: avg(filterNonNullNumbers(grossMargins)),
    avgNetMargin: avg(filterNonNullNumbers(netMargins)),
  };
};

export const computeAveragePE = (
  prices: Record<string, number>,
  epsMap: Record<string, number>
) => {
  const peValues: number[] = [];

  for (const stockId of Object.keys(prices)) {
    const price = prices[stockId];
    const eps = epsMap[stockId];
    if (eps && eps !== 0) {
      peValues.push(price / eps);
    }
  }

  return avg(peValues);
};
