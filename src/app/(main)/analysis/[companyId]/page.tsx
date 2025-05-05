import React from "react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import MetricCard from "../../Components/MetricCard";
import StockMetricsView from "../../Components/StockMetricsView";
import { EarningsRevenueChart } from "../../Components/EarningsRevenueChart";
import MetricGauge from "../../Components/MetricGauge";
import PriceOverTimeChart from "../../Components/PriceOverTimeChart";
import { StockMetric, Financial, StockMetricsData } from "@/types/common";
import { formatCurrency } from "@/utils/formatters";


// Utility functions
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
    currentRatio: calcRatio(
      financial.current_assets,
      financial.current_liabilities
    ),
    quickRatio: calcRatio(
      financial.current_assets - financial.inventory,
      financial.current_liabilities
    ),
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
      filterNonNullNumbers(
        metrics.map((m) => Number(m.trailing_annual_dividend_rate))
      )
    ),
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

// Data fetching functions
const fetchCompanyData = async (supabase: any, companyId: string) => {
  const { data: company } = await supabase
    .from("stocks")
    .select("*")
    .eq("stock_id", companyId)
    .single();

  return company;
};

function getImageUrl(supabase: any, path: string) {
  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  return data.publicUrl;
}

const fetchCompanyMetrics = async (supabase: any, companyId: string) => {
  const { data: metrics } = await supabase
    .from("stock_metrics")
    .select("*")
    .eq("stock_id", companyId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  return metrics;
};

const fetchCompanyPrices = async (supabase: any, companyId: string) => {
  const { data: prices } = await supabase
    .from("stock_prices")
    .select("*")
    .eq("stock_id", companyId)
    .order("date", { ascending: false })
    .limit(7);

  return prices;
};

const fetchCompanyFinancials = async (supabase: any, companyId: string) => {
  const { data: financials } = await supabase
    .from("financials")
    .select("*")
    .eq("stock_id", companyId)
    .single();

  return financials;
};

const fetchSectorStocks = async (supabase: any, sector: string) => {
  const { data: allStocks } = await supabase
    .from("stocks")
    .select("stock_id, sector");

  return (
    allStocks?.filter((s) => s.sector === sector).map((s) => s.stock_id) ?? []
  );
};

const fetchAllFinancials = async (supabase: any) => {
  const { data: allFinancials } = await supabase
    .from("financials")
    .select(
      "stock_id, total_revenue, total_assets, cost_of_revenue, current_assets, current_liabilities, inventory, ebit, interest_expenses, other_expenses"
    );

  return allFinancials;
};

const fetchSectorMetrics = async (supabase: any, sectorStockIds: string[]) => {
  const { data: sectorMetrics } = await supabase
    .from("stock_metrics")
    .select(
      "stock_id, return_on_equity, return_on_assets, payout_ratio, eps, trailing_annual_dividend_rate"
    )
    .in("stock_id", sectorStockIds);

  return sectorMetrics;
};

const fetchMarketMetrics = async (supabase: any) => {
  const { data: marketMetrics } = await supabase
    .from("stock_metrics")
    .select(
      "return_on_equity, return_on_assets, payout_ratio, eps, trailing_annual_dividend_rate"
    );

  return marketMetrics;
};
const fetchLatestMetricsForStocks = async (
  supabase: any,
  stockIds: string[]
) => {
  const { data } = await supabase
    .from("stock_metrics")
    .select("stock_id, eps, date")
    .in("stock_id", stockIds)
    .order("date", { ascending: false });

  const latestByStock: Record<string, number> = {};
  for (const entry of data ?? []) {
    if (entry.eps && !latestByStock[entry.stock_id]) {
      latestByStock[entry.stock_id] = Number(entry.eps);
    }
  }
  return latestByStock;
};

const fetchLatestPricesForStocks = async (
  supabase: any,
  stockIds: string[]
) => {
  const { data } = await supabase
    .from("stock_prices")
    .select("stock_id, share_price, date")
    .in("stock_id", stockIds)
    .order("date", { ascending: false });

  const latestPrices: Record<string, number> = {};
  for (const entry of data ?? []) {
    if (!latestPrices[entry.stock_id]) {
      latestPrices[entry.stock_id] = Number(entry.share_price);
    }
  }
  return latestPrices;
};

const computeAveragePE = (
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

const Page = async ({ params }: { params: { companyId: string } }) => {
  const supabase = createServerComponentClient({ cookies });
  const { companyId } = params;

  // Fetch company data
  const company = await fetchCompanyData(supabase, companyId);
  if (!company) {
    return (
      <div className="text-red-500 p-6">
        Failed to fetch data for company ID: {companyId}
      </div>
    );
  }

  // Fetch company specific data
  const metrics = await fetchCompanyMetrics(supabase, companyId);
  const prices = await fetchCompanyPrices(supabase, companyId);
  const financials = await fetchCompanyFinancials(supabase, companyId);

  // Calculate financial ratios for the company
  const {
    grossProfit,
    netIncome,
    grossMargin,
    netMargin,
    assetTurnover,
    currentRatio,
    quickRatio,
    interestCoverage,
  } = calculateFinancialRatios(financials);

  // Calculate PE ratio
  const latestPrice = prices?.[0]?.share_price;
  const peRatio =
    latestPrice && metrics?.eps && Number(metrics.eps) !== 0
      ? latestPrice / Number(metrics.eps)
      : null;

  const dividendYield = metrics?.trailing_annual_dividend_rate ?? null;

  // Fetch sector and market data
  const sector = company.sector;
  const sectorStockIds = await fetchSectorStocks(supabase, sector);
  const allFinancials = await fetchAllFinancials(supabase);
  const sectorMetrics = await fetchSectorMetrics(supabase, sectorStockIds);
  const marketMetrics = await fetchMarketMetrics(supabase);

  const allStockIds = allFinancials.map((f) => f.stock_id);

  const sectorEPSMap = await fetchLatestMetricsForStocks(
    supabase,
    sectorStockIds
  );
  const sectorPricesMap = await fetchLatestPricesForStocks(
    supabase,
    sectorStockIds
  );
  const avgSectorPE = computeAveragePE(sectorPricesMap, sectorEPSMap);

  const marketEPSMap = await fetchLatestMetricsForStocks(supabase, allStockIds);
  const marketPricesMap = await fetchLatestPricesForStocks(
    supabase,
    allStockIds
  );
  const avgMarketPE = computeAveragePE(marketPricesMap, marketEPSMap);

  const sharesOutstanding = Number(company.shares_outstanding) || 0;
  const marketCap = latestPrice * sharesOutstanding;
  // Filter financials by sector
  const sectorFinancials =
    allFinancials?.filter((f) => sectorStockIds.includes(f.stock_id)) ?? [];

  // Calculate sector and market averages
  const sectorMetricAverages = calculateAverageMetrics(sectorMetrics);
  const marketMetricAverages = calculateAverageMetrics(marketMetrics);

  const sectorFinancialAverages =
    calculateAverageFinancialRatios(sectorFinancials);
  const marketFinancialAverages =
    calculateAverageFinancialRatios(allFinancials);


  // Prepare metrics for the view
  const stockMetrics: StockMetric[] = [
    {
      title: "Return on Equity",
      key: "roe",
      value: metrics.return_on_equity,
      sector: sectorMetricAverages.avgROE,
      market: marketMetricAverages.avgROE,
      isPercentage: true,
    },
    {
      title: "Return on Assets",
      key: "roa",
      value: metrics.return_on_assets,
      sector: sectorMetricAverages.avgROA,
      market: marketMetricAverages.avgROA,
      isPercentage: true,
    },
    {
      title: "Payout Ratio",
      key: "payout",
      value: metrics.payout_ratio,
      sector: sectorMetricAverages.avgPayout,
      market: marketMetricAverages.avgPayout,
      isPercentage: true,
    },
    {
      title: "EPS",
      key: "eps",
      value: metrics.eps ? Number(metrics.eps) : null,
      sector: sectorMetricAverages.avgEPS,
      market: marketMetricAverages.avgEPS,
      isPercentage: false,
    },
    {
      title: "Asset Turnover",
      key: "asset_turnover",
      value: assetTurnover,
      sector: sectorFinancialAverages.avgAssetTurnover,
      market: marketFinancialAverages.avgAssetTurnover,
      isPercentage: false,
    },
    {
      title: "Gross Margin",
      key: "gross_margin",
      value: grossMargin,
      sector: sectorFinancialAverages.avgGrossMargin,
      market: marketFinancialAverages.avgGrossMargin,
      isPercentage: true,
    },
    {
      title: "Net Profit Margin",
      key: "net_margin",
      value: netMargin,
      sector: sectorFinancialAverages.avgNetMargin,
      market: marketFinancialAverages.avgNetMargin,
      isPercentage: true,
    },
    {
      title: "Dividend Yield",
      key: "div_yield",
      value: dividendYield,
      sector: sectorMetricAverages.avgDividendYield,
      market: marketMetricAverages.avgDividendYield,
      isPercentage: true,
    },
    {
      title: "P/E Ratio",
      key: "pe",
      value: peRatio,
      sector: avgSectorPE, //TODO
      market: avgMarketPE, //TODO
      isPercentage: false,
    },
    {
      title: "Current Ratio",
      key: "current_ratio",
      value: currentRatio,
      sector: sectorFinancialAverages.avgCurrentRatio,
      market: marketFinancialAverages.avgCurrentRatio,
      isPercentage: false,
    },
    {
      title: "Quick Ratio",
      key: "quick_ratio",
      value: quickRatio,
      sector: sectorFinancialAverages.avgQuickRatio,
      market: marketFinancialAverages.avgQuickRatio,
      isPercentage: false,
    },
    {
      title: "Interest Coverage",
      key: "interest_coverage",
      value: interestCoverage,
      sector: sectorFinancialAverages.avgInterestCoverage,
      market: marketFinancialAverages.avgInterestCoverage,
      isPercentage: false,
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Company Overview */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3 space-y-6">
          <div className="flex items-center space-x-6">
            {/* <div className="bg-black dark:bg-white text-white dark:text-black rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold shadow-md">
              {company.ticker?.[0]}
            </div> */}
            <div className="h-40 w-40 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-300">
  <img
    src={getImageUrl(supabase, company.logo_url)}
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
              <strong>Shares Outstanding:</strong>{" "}
              {formatCurrency(sharesOutstanding) ?? "N/A"}
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <strong>Price:</strong>{" "}
              {latestPrice ? `${formatCurrency(latestPrice.toFixed(2))}` : "N/A"}
            </div>
          </div>
        </div>

        <div className="md:w-1/3 flex justify-center items-center">
          <MetricGauge
            title="Current Ratio Gauge"
            company={currentRatio ?? 0}
            sector={sectorFinancialAverages.avgCurrentRatio ?? 0}
            market={marketFinancialAverages.avgCurrentRatio ?? 0}
            max={3}
          />
        </div>
      </div>

      {metrics && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Chart on the left */}
          <div className="md:w-1/2 h-full min-h-[280px]">
            <PriceOverTimeChart prices={prices ?? []} />
          </div>

          {/* Metric cards on the right */}
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
            <MetricCard
              title="Dividend Yield"
              value={metrics.trailing_annual_dividend_rate}
            />
            <MetricCard
              title="Return on Equity"
              value={metrics.return_on_equity}
            />
          </div>
        </div>
      )}

      {/* Chart Placeholders */}
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Company Overview */}
        {/* ... Keep existing company UI */}

        {/* Metric Comparison Grid */}
        <StockMetricsView metrics={stockMetrics} />

        <EarningsRevenueChart
          revenue={financials?.total_revenue}
          costOfRevenue={financials?.cost_of_revenue}
          otherExpenses={financials?.other_expenses}
        />
      </div>
    </div>
  );
};

export default Page;
