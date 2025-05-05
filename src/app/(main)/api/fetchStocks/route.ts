import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Type declarations
type StockPriceEntry = {
  stock_id: number;
  share_price: number;
};

type UserFollow = {
  user_id: string;
};

type Financial = {
  financial_id: number;
  total_assets: number;
  total_debt: number;
  shareholders_equity: number;
  date: string;
};

type Metric = {
  metric_id: number;
  return_on_equity: number;
  eps: number;
  date: string;
};

type SupabaseStock = {
  stock_id: number;
  ticker: string;
  company_name: string;
  company_name_arabic: string;
  sector: string;
  sector_arabic: string;
  shares_outstanding: number;
  prices?: StockPriceEntry[];
  financials?: Financial[];
  metrics?: Metric[];
  user_follows?: UserFollow[];
};

// Cache state
let cachedSupabaseData: SupabaseStock[] | null = null;
let cachedSheetData: Record<string, any> | null = null;
let lastSupabaseFetched = 0;
let lastSheetFetch = 0;
const SUPABASE_CACHE_DURATION = 60 * 60 * 1000;
const SHEET_CACHE_DURATION = 60 * 1000;

let cachedResponse: { source: string; data: any } | null = null;
let lastResponseFetch = 0;
const RESPONSE_CACHE_DURATION = 60 * 1000;

export async function GET() {
  const now = Date.now();
  const supabase = await createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const user_id = session?.user?.id;

  const fetchSupabaseData = async () => {
    if (cachedSupabaseData && now - lastSupabaseFetched < SUPABASE_CACHE_DURATION) {
      return { source: "cache", data: cachedSupabaseData };
    }

    const { data, error } = await supabase
      .from("stocks")
      .select(
        `
        stock_id,
        ticker,
        company_name,
        sector,
        shares_outstanding,
        company_name_arabic,
        sector_arabic,
        prices:stock_prices(
          price_id,
          share_price,
          market_cap,
          date
        ),
        financials:financials(
          financial_id,
          total_assets,
          total_debt,
          shareholders_equity,
          date
        ),
        metrics:stock_metrics(
          metric_id,
          return_on_equity,
          eps,
          date
        ),
        user_follows ( user_id )
      `
      )
      .order("date", { ascending: false, referencedTable: "stock_prices" })
      .limit(1, { foreignTable: "prices" })
      .limit(1, { foreignTable: "financials" })
      .limit(1, { foreignTable: "metrics" });

    if (error) throw new Error(error.message);

    cachedSupabaseData = data as SupabaseStock[];
    lastSupabaseFetched = now;

    return { source: "fresh", data: cachedSupabaseData };
  };

  const fetchGoogleSheetData = async () => {
    if (cachedSheetData && now - lastSheetFetch < SHEET_CACHE_DURATION) {
      return cachedSheetData;
    }

    const res = await fetch(`${process.env.SITE_URL}/api/fetchCurrentPrices`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) throw new Error("Google Sheets fetch failed");

    const sheetData = await res.json();
    cachedSheetData = sheetData;
    lastSheetFetch = now;

    return sheetData;
  };

  if (cachedResponse && now - lastResponseFetch < RESPONSE_CACHE_DURATION) {
    return NextResponse.json(cachedResponse.data, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    });
  }

  try {
    const [supabaseData, googleSheetData] = await Promise.all([
      fetchSupabaseData(),
      fetchGoogleSheetData(),
    ]);

    const oneYearAgoDate = new Date();
    const oneMonthAgoDate = new Date();
    oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);
    oneYearAgoDate.setDate(1);
    oneMonthAgoDate.setMonth(oneMonthAgoDate.getMonth() - 1);

    const oneYearAgoPrices = await supabase
      .from("stock_prices")
      .select("stock_id, share_price")
      .eq("date", oneYearAgoDate.toISOString().split("T")[0]);

    const oneMonthAgoPrices = await supabase
      .from("stock_prices")
      .select("stock_id, share_price")
      .eq("date", oneMonthAgoDate.toISOString().split("T")[0]);

    const transformedStocks = (supabaseData.data as SupabaseStock[]).map(
      (stock) => {
        const latestFinancial = stock.financials?.[0] || null;
        const latestMetric = stock.metrics?.[0] || null;

        const oneYearAgoPrice =
          oneYearAgoPrices.data?.find((p: StockPriceEntry) => p.stock_id === stock.stock_id)
            ?.share_price || null;

        const oneMonthAgoPrice =
          oneMonthAgoPrices.data?.find((p: StockPriceEntry) => p.stock_id === stock.stock_id)
            ?.share_price || null;

        const is_followed =
          !!user_id &&
          Array.isArray(stock.user_follows) &&
          stock.user_follows.some((follow) => follow.user_id === user_id);

        return {
          stock_id: stock.stock_id,
          ticker: stock.ticker,
          company_name: stock.company_name,
          company_name_arabic: stock.company_name_arabic,
          sector: stock.sector,
          sector_arabic: stock.sector_arabic,
          shares_outstanding: stock.shares_outstanding,
          oneYearAgoPrice,
          oneMonthAgoPrice,
          latest_price: googleSheetData[stock.ticker],
          latest_financial: latestFinancial,
          latest_metric: latestMetric,
          is_followed,
        };
      }
    );

    cachedResponse = {
      source: "fresh",
      data: transformedStocks,
    };
    lastResponseFetch = now;

    return NextResponse.json(transformedStocks, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to load data", details: errorMessage },
      { status: 500 }
    );
  }
}
