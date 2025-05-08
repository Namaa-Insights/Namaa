import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Metadata } from 'next';
import MetricCard from '../../Components/MetricCard';
import StockMetricsView from '../../Components/StockMetricsView';
import { EarningsRevenueChart } from '../../Components/EarningsRevenueChart';
import MetricGauge from '../../Components/MetricGauge';
import PriceOverTimeChart from '../../Components/PriceOverTimeChart';

import {
  fetchCompanyData,
  fetchCompanyFinancials,
  fetchCompanyMetrics,
  fetchCompanyPrices,
  fetchAllFinancials,
  fetchSectorStocks,
  fetchSectorMetrics,
  fetchMarketMetrics,
  fetchLatestMetricsForStocks,
  fetchLatestPricesForStocks,
  getImageUrl,
  computeAveragePE,
} from '@/lib/data-fetchers';

import {
  calculateFinancialRatios,
  calculateAverageMetrics,
  calculateAverageFinancialRatios,
} from '@/lib/metrics-utils';

import { StockMetric } from '@/types/common';
import { formatCurrency } from '@/utils/formatters';

export const dynamic = 'force-dynamic';

// Fixed the type definition for the metadata function
export async function generateMetadata({
  params,
}: {
  params: { companyId: string };
}): Promise<Metadata> {
  return {
    title: `Company Overview - ${params.companyId}`,
  };
}

// Fixed the type definition for the main page component
export default async function CompanyPage({
  params,
}: {
  params: { companyId: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const { companyId } = params;

  const company = await fetchCompanyData(supabase, companyId);
  if (!company) {
    return (
      <div className="text-red-500 p-6">
        Failed to fetch data for company ID: {companyId}
      </div>
    );
  }

  const [metrics, prices, financials] = await Promise.all([
    fetchCompanyMetrics(supabase, companyId),
    fetchCompanyPrices(supabase, companyId),
    fetchCompanyFinancials(supabase, companyId),
  ]);

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

  const latestPrice = prices?.[0]?.share_price ?? null;
  const peRatio =
    latestPrice && metrics?.eps && Number(metrics.eps) !== 0
      ? latestPrice / Number(metrics.eps)
      : null;

  const dividendYield = metrics?.trailing_annual_dividend_rate ?? null;

  const sectorStockIds = await fetchSectorStocks(supabase, company.sector);

  const [allFinancials, sectorMetrics, marketMetrics] = await Promise.all([
    fetchAllFinancials(supabase),
    fetchSectorMetrics(supabase, sectorStockIds),
    fetchMarketMetrics(supabase),
  ]);

  const allStockIds = allFinancials.map((f) => f.stock_id);

  const [sectorEPSMap, sectorPricesMap, marketEPSMap, marketPricesMap] =
    await Promise.all([
      fetchLatestMetricsForStocks(supabase, sectorStockIds),
      fetchLatestPricesForStocks(supabase, sectorStockIds),
      fetchLatestMetricsForStocks(supabase, allStockIds),
      fetchLatestPricesForStocks(supabase, allStockIds),
    ]);

  const [avgSectorPE, avgMarketPE] = [
    computeAveragePE(sectorPricesMap, sectorEPSMap),
    computeAveragePE(marketPricesMap, marketEPSMap),
  ];

  const sharesOutstanding = Number(company.shares_outstanding) || 0;
  const marketCap = latestPrice ? latestPrice * sharesOutstanding : null;

  const sectorFinancials = allFinancials.filter((f) =>
    sectorStockIds.includes(f.stock_id)
  );

  const sectorMetricAverages = calculateAverageMetrics(sectorMetrics);
  const marketMetricAverages = calculateAverageMetrics(marketMetrics);

  const sectorFinancialAverages =
    calculateAverageFinancialRatios(sectorFinancials);
  const marketFinancialAverages =
    calculateAverageFinancialRatios(allFinancials);

  const stockMetrics: StockMetric[] = [
    {
      title: 'Return on Equity',
      key: 'roe',
      value: metrics?.return_on_equity,
      sector: sectorMetricAverages.avgROE,
      market: marketMetricAverages.avgROE,
      isPercentage: true,
    },
    {
      title: 'Return on Assets',
      key: 'roa',
      value: metrics?.return_on_assets,
      sector: sectorMetricAverages.avgROA,
      market: marketMetricAverages.avgROA,
      isPercentage: true,
    },
    {
      title: 'Payout Ratio',
      key: 'payout',
      value: metrics?.payout_ratio,
      sector: sectorMetricAverages.avgPayout,
      market: marketMetricAverages.avgPayout,
      isPercentage: true,
    },
    {
      title: 'EPS',
      key: 'eps',
      value: metrics?.eps ?? null,
      sector: sectorMetricAverages.avgEPS,
      market: marketMetricAverages.avgEPS,
      isPercentage: false,
    },
    {
      title: 'Asset Turnover',
      key: 'asset_turnover',
      value: assetTurnover,
      sector: sectorFinancialAverages.avgAssetTurnover,
      market: marketFinancialAverages.avgAssetTurnover,
      isPercentage: false,
    },
    {
      title: 'Gross Margin',
      key: 'gross_margin',
      value: grossMargin,
      sector: sectorFinancialAverages.avgGrossMargin,
      market: marketFinancialAverages.avgGrossMargin,
      isPercentage: true,
    },
    {
      title: 'Net Profit Margin',
      key: 'net_margin',
      value: netMargin,
      sector: sectorFinancialAverages.avgNetMargin,
      market: marketFinancialAverages.avgNetMargin,
      isPercentage: true,
    },
    {
      title: 'Dividend Yield',
      key: 'div_yield',
      value: dividendYield,
      sector: sectorMetricAverages.avgDividendYield,
      market: marketMetricAverages.avgDividendYield,
      isPercentage: true,
    },
    {
      title: 'P/E Ratio',
      key: 'pe',
      value: peRatio,
      sector: avgSectorPE,
      market: avgMarketPE,
      isPercentage: false,
    },
    {
      title: 'Current Ratio',
      key: 'current_ratio',
      value: currentRatio,
      sector: sectorFinancialAverages.avgCurrentRatio,
      market: marketFinancialAverages.avgCurrentRatio,
      isPercentage: false,
    },
    {
      title: 'Quick Ratio',
      key: 'quick_ratio',
      value: quickRatio,
      sector: sectorFinancialAverages.avgQuickRatio,
      market: marketFinancialAverages.avgQuickRatio,
      isPercentage: false,
    },
    {
      title: 'Interest Coverage',
      key: 'interest_coverage',
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
                Ticker:{' '}
                <span className="font-medium">{company.ticker}</span>
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
              <strong>Shares Outstanding:</strong>{' '}
              {formatCurrency(sharesOutstanding)}
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <strong>Price:</strong>{' '}
              {latestPrice
                ? `${formatCurrency(latestPrice.toFixed(2))}`
                : 'N/A'}
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

      {/* Metrics and Charts */}
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
                  : 'N/A'
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

      <StockMetricsView metrics={stockMetrics} />

      <EarningsRevenueChart
        revenue={financials?.total_revenue}
        costOfRevenue={financials?.cost_of_revenue}
        otherExpenses={financials?.other_expenses}
      />
    </div>
  );
}