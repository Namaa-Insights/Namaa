import React from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

import MetricCard from "../../Components/MetricCard";
import StockMetricsView from "../../Components/StockMetricsView";
import { EarningsRevenueChart } from "../../Components/EarningsRevenueChart";
import MetricGauge from "../../Components/MetricGauge";
import PriceOverTimeChart from "../../Components/PriceOverTimeChart";
import { StockMetric, Financial, StockMetricsData } from "@/types/common";
import { formatCurrency } from "@/utils/formatters";

// =======================
// Utility Functions
// =======================

const calcRatio = (
  a: number | null,
  b: number | null,
  options?: { allowZeroB?: boolean }
): number | null => {
  if (a == null || b == null) return null;
  if (!options?.allowZeroB && b === 0) return null;
  const result = a / b;
  return isFinite(result) && !isNaN(result) ? result : null;
};

const avg = (arr: number[]): number | null =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

const filterNonNullNumbers = (values: (number | null)[]): number[] =>
  values.filter((v): v is number => v !== null && !isNaN(v));

const calculateFinancialRatios = (financial: Financial | null) => {
  if (!financial)
    return {
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
    quickRatio: calcRatio(financial.current_assets - financial.inventory, financial.current_liabilities),
    interestCoverage: calcRatio(financial.ebit, financial.interest_expenses),
  };
};

const calculateAverageMetrics = (metrics: StockMetricsData[] | null) => {
  if (!metrics)
    return {
      avgROE: null,
      avgROA: null,
      avgEPS: null,
      avgPayout: null,
      avgDividendYield: null,
    };

  return {
    avgROE: avg(filterNonNullNumbers(metrics.map((m) => Number(m.return_on_equity)))),
    avgROA: avg(filterNonNullNumbers(metrics.map((m) => Number(m.return_on_assets)))),
    avgEPS: avg(filterNonNullNumbers(metrics.map((m) => Number(m.eps)))),
    avgPayout: avg(filterNonNullNumbers(metrics.map((m) => Number(m.payout_ratio)))),
    avgDividendYield: avg(filterNonNullNumbers(metrics.map((m) => Number(m.trailing_annual_dividend_rate)))),
  };
};

const calculateAverageFinancialRatios = (financials: Financial[] | null) => {
  if (!financials)
    return {
      avgAssetTurnover: null,
      avgCurrentRatio: null,
      avgQuickRatio: null,
      avgInterestCoverage: null,
      avgGrossMargin: null,
      avgNetMargin: null,
    };

  return {
    avgAssetTurnover: avg(filterNonNullNumbers(financials.map((f) => calcRatio(f.total_revenue, f.total_assets)))),
    avgCurrentRatio: avg(filterNonNullNumbers(financials.map((f) => calcRatio(f.current_assets, f.current_liabilities)))),
    avgQuickRatio: avg(filterNonNullNumbers(financials.map((f) => calcRatio(f.current_assets - f.inventory, f.current_liabilities)))),
    avgInterestCoverage: avg(filterNonNullNumbers(financials.map((f) => calcRatio(f.ebit, f.interest_expenses)))),
    avgGrossMargin: avg(filterNonNullNumbers(financials.map((f) => calcRatio(f.total_revenue - f.cost_of_revenue, f.total_revenue)))),
    avgNetMargin: avg(filterNonNullNumbers(financials.map((f) => calcRatio(f.total_revenue - f.cost_of_revenue - f.other_expenses, f.total_revenue)))),
  };
};

// =======================
// Page Component
// =======================

const Page = async ({ params }: { params: { companyId: string } }) => {
  const supabase = await createClient(); // ✅ Inferred typed Supabase client
  const { companyId } = params;

  const { data: company } = await supabase
    .from("stocks")
    .select("*")
    .eq("stock_id", companyId)
    .single();

  if (!company) {
    return <div className="text-red-500 p-6">Company not found</div>;
  }

  const { data: metrics } = await supabase
    .from("stock_metrics")
    .select("*")
    .eq("stock_id", companyId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const { data: prices } = await supabase
    .from("stock_prices")
    .select("*")
    .eq("stock_id", companyId)
    .order("date", { ascending: false })
    .limit(7);

  const { data: financials } = await supabase
    .from("financials")
    .select("*")
    .eq("stock_id", companyId)
    .single();

  const {
    grossMargin,
    netMargin,
    assetTurnover,
    currentRatio,
    quickRatio,
    interestCoverage,
  } = calculateFinancialRatios(financials);

  const latestPrice = prices?.[0]?.share_price ?? 0;
  const peRatio =
    latestPrice && metrics?.eps && Number(metrics.eps) !== 0
      ? latestPrice / Number(metrics.eps)
      : null;

  const dividendYield = metrics?.trailing_annual_dividend_rate ?? null;
  const sharesOutstanding = Number(company.shares_outstanding) || 0;
  const marketCap = latestPrice * sharesOutstanding;

  // You can continue with fetching sector/market data and rendering UI below...

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3 space-y-6">
          <div className="flex items-center space-x-6">
            <div className="h-40 w-40 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-300">
              <img
                src={supabase.storage.from("logos").getPublicUrl(company.logo_url).data.publicUrl}
                alt="Company Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{company.company_name}</h1>
              <p className="text-base text-gray-600 dark:text-gray-300 mt-1">
                Ticker: <span className="font-medium">{company.ticker}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[15px] font-SaudiRiyal">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <strong>Sector:</strong> {company.sector}
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <strong>Market Cap:</strong> {formatCurrency(marketCap)}
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <strong>Shares Outstanding:</strong> {formatCurrency(sharesOutstanding)}
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <strong>Price:</strong> {latestPrice ? formatCurrency(latestPrice.toFixed(2)) : "N/A"}
            </div>
          </div>
        </div>

        <div className="md:w-1/3 flex justify-center items-center">
          <MetricGauge
            title="Current Ratio Gauge"
            company={currentRatio ?? 0}
            sector={currentRatio ?? 0}
            market={currentRatio ?? 0}
            max={3}
          />
        </div>
      </div>

      {metrics && (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2 h-full min-h-[280px]">
            <PriceOverTimeChart prices={prices ?? []} />
          </div>
          <div className="md:w-1/2 grid grid-cols-2 gap-4">
            <MetricCard title="Earnings Per Share (EPS)" value={metrics.eps} />
            <MetricCard
              title="(P/E) Ratio"
              value={
                metrics.eps && metrics.eps > 0
                  ? (latestPrice / metrics.eps).toFixed(1)
                  : "N/A"
              }
            />
            <MetricCard title="Dividend Yield" value={metrics.trailing_annual_dividend_rate} />
            <MetricCard title="Return on Equity" value={metrics.return_on_equity} />
          </div>
        </div>
      )}

      <StockMetricsView
        metrics={[
          {
            title: "Return on Equity",
            key: "roe",
            value: metrics?.return_on_equity,
            sector: null,
            market: null,
            isPercentage: true,
          },
          {
            title: "P/E Ratio",
            key: "pe",
            value: peRatio,
            sector: null,
            market: null,
            isPercentage: false,
          },
          // Add more metric cards as needed
        ]}
      />

      <EarningsRevenueChart
        revenue={financials?.total_revenue}
        costOfRevenue={financials?.cost_of_revenue}
        otherExpenses={financials?.other_expenses}
      />
    </div>
  );
};

export default Page;
