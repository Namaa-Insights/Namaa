// app/companies/[companyId]/page.tsx
// 'use client';

import React from 'react';
import { createClient } from '@/utils/supabase/server';
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

import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { companyId: string } }): Promise<Metadata> {
  return {
    title: `Company ${params.companyId}`,
  };
}

const Page = async ({ params }: { params: { companyId: string } }) => {
  const supabase = await createClient();
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

  const stockMetrics: StockMetric[] = [
    {
      title: 'Return on Equity',
      key: 'roe',
      value: metrics?.return_on_equity,
      sector: calculateAverageMetrics(sectorMetrics).avgROE,
      market: calculateAverageMetrics(marketMetrics).avgROE,
      isPercentage: true,
    },
    {
      title: 'Return on Assets',
      key: 'roa',
      value: metrics?.return_on_assets,
      sector: calculateAverageMetrics(sectorMetrics).avgROA,
      market: calculateAverageMetrics(marketMetrics).avgROA,
      isPercentage: true,
    },
    {
      title: 'Payout Ratio',
      key: 'payout',
      value: metrics?.payout_ratio,
      sector: calculateAverageMetrics(sectorMetrics).avgPayout,
      market: calculateAverageMetrics(marketMetrics).avgPayout,
      isPercentage: true,
    },
    {
      title: 'EPS',
      key: 'eps',
      value: metrics?.eps ?? null,
      sector: calculateAverageMetrics(sectorMetrics).avgEPS,
      market: calculateAverageMetrics(marketMetrics).avgEPS,
      isPercentage: false,
    },
    {
      title: 'Asset Turnover',
      key: 'asset_turnover',
      value: assetTurnover,
      sector: calculateAverageFinancialRatios(sectorFinancials)
        .avgAssetTurnover,
      market: calculateAverageFinancialRatios(allFinancials).avgAssetTurnover,
      isPercentage: false,
    },
    {
      title: 'Gross Margin',
      key: 'gross_margin',
      value: grossMargin,
      sector: calculateAverageFinancialRatios(sectorFinancials).avgGrossMargin,
      market: calculateAverageFinancialRatios(allFinancials).avgGrossMargin,
      isPercentage: true,
    },
    {
      title: 'Net Profit Margin',
      key: 'net_margin',
      value: netMargin,
      sector: calculateAverageFinancialRatios(sectorFinancials).avgNetMargin,
      market: calculateAverageFinancialRatios(allFinancials).avgNetMargin,
      isPercentage: true,
    },
    {
      title: 'Dividend Yield',
      key: 'div_yield',
      value: dividendYield,
      sector: calculateAverageMetrics(sectorMetrics).avgDividendYield,
      market: calculateAverageMetrics(marketMetrics).avgDividendYield,
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
      sector: calculateAverageFinancialRatios(sectorFinancials).avgCurrentRatio,
      market: calculateAverageFinancialRatios(allFinancials).avgCurrentRatio,
      isPercentage: false,
    },
    {
      title: 'Quick Ratio',
      key: 'quick_ratio',
      value: quickRatio,
      sector: calculateAverageFinancialRatios(sectorFinancials).avgQuickRatio,
      market: calculateAverageFinancialRatios(allFinancials).avgQuickRatio,
      isPercentage: false,
    },
    {
      title: 'Interest Coverage',
      key: 'interest_coverage',
      value: interestCoverage,
      sector:
        calculateAverageFinancialRatios(sectorFinancials).avgInterestCoverage,
      market: calculateAverageFinancialRatios(allFinancials).avgInterestCoverage,
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
              <strong>Shares Outstanding:</strong>{' '}
              {formatCurrency(sharesOutstanding) ?? 'N/A'}
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <strong>Price:</strong>{' '}
              {latestPrice ? `${formatCurrency(latestPrice.toFixed(2))}` : 'N/A'}
            </div>
          </div>
        </div>

        <div className="md:w-1/3 flex justify-center items-center">
          <MetricGauge
            title="Current Ratio Gauge"
            company={currentRatio ?? 0}
            sector={
              calculateAverageFinancialRatios(sectorFinancials).avgCurrentRatio ??
              0
            }
            market={
              calculateAverageFinancialRatios(allFinancials).avgCurrentRatio ?? 0
            }
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
};

export default Page;
