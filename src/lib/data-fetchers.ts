import { SupabaseClient } from '@supabase/auth-helpers-nextjs';

export async function fetchCompanyData(supabase: SupabaseClient, companyId: string) {
  const { data } = await supabase.from('stocks').select('*').eq('stock_id', companyId).single();
  return data;
}

export function getImageUrl(supabase: SupabaseClient, path: string) {
  const { data } = supabase.storage.from('logos').getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchCompanyMetrics(supabase: SupabaseClient, companyId: string) {
  const { data } = await supabase
    .from('stock_metrics')
    .select('*')
    .eq('stock_id', companyId)
    .order('date', { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function fetchCompanyPrices(supabase: SupabaseClient, companyId: string) {
  const { data } = await supabase
    .from('stock_prices')
    .select('*')
    .eq('stock_id', companyId)
    .order('date', { ascending: false })
    .limit(7);
  return data;
}

export async function fetchCompanyFinancials(supabase: SupabaseClient, companyId: string) {
  const { data } = await supabase
    .from('financials')
    .select('*')
    .eq('stock_id', companyId)
    .single();
  return data;
}

export async function fetchSectorStocks(supabase: SupabaseClient, sector: string) {
  const { data } = await supabase.from('stocks').select('stock_id, sector');
  return data?.filter((s) => s.sector === sector).map((s) => s.stock_id) ?? [];
}

export async function fetchAllFinancials(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('financials')
    .select(
      'stock_id, total_revenue, total_assets, cost_of_revenue, current_assets, current_liabilities, inventory, ebit, interest_expenses, other_expenses'
    );
  return data ?? [];
}

export async function fetchSectorMetrics(supabase: SupabaseClient, sectorStockIds: string[]) {
  const { data } = await supabase
    .from('stock_metrics')
    .select('stock_id, return_on_equity, return_on_assets, payout_ratio, eps, trailing_annual_dividend_rate')
    .in('stock_id', sectorStockIds);
  return data ?? [];
}

export async function fetchMarketMetrics(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('stock_metrics')
    .select('return_on_equity, return_on_assets, payout_ratio, eps, trailing_annual_dividend_rate');
  return data ?? [];
}

export async function fetchLatestMetricsForStocks(
  supabase: SupabaseClient,
  stockIds: string[]
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('stock_metrics')
    .select('stock_id, eps, date')
    .in('stock_id', stockIds)
    .order('date', { ascending: false });

  const latestByStock: Record<string, number> = {};
  for (const entry of data ?? []) {
    if (entry.eps && !latestByStock[entry.stock_id]) {
      latestByStock[entry.stock_id] = Number(entry.eps);
    }
  }
  return latestByStock;
}

export async function fetchLatestPricesForStocks(
  supabase: SupabaseClient,
  stockIds: string[]
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('stock_prices')
    .select('stock_id, share_price, date')
    .in('stock_id', stockIds)
    .order('date', { ascending: false });

  const latestPrices: Record<string, number> = {};
  for (const entry of data ?? []) {
    if (!latestPrices[entry.stock_id]) {
      latestPrices[entry.stock_id] = Number(entry.share_price);
    }
  }
  return latestPrices;
}

export function computeAveragePE(
  prices: Record<string, number>,
  epsMap: Record<string, number>
): number | null {
  const peValues: number[] = [];
  for (const stockId of Object.keys(prices)) {
    const price = prices[stockId];
    const eps = epsMap[stockId];
    if (eps && eps !== 0) {
      peValues.push(price / eps);
    }
  }
  return peValues.length ? peValues.reduce((a, b) => a + b, 0) / peValues.length : null;
}
