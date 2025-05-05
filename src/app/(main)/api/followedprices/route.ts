// File: app/api/stocks/followed-prices/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type StockPriceRecord = {
  date: string;
  share_price: number;
};

type StockData = {
  ticker: string;
  company_name: string;
  stock_prices: StockPriceRecord[];
};

type FollowedStockRecord = {
  stock_id: number;
  stocks: StockData;
};

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const user_id = session.user.id;

    // Fetch all followed stocks with their price history
    const { data: followedStocks, error } = await supabase
      .from("user_follows")
      .select(
        `
        stock_id,
        stocks(
          ticker,
          company_name,
          stock_prices(date, share_price)
        )
      `
      )
      .eq("user_id", user_id);

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data for easier consumption by the frontend
    const transformedData = (followedStocks as FollowedStockRecord[]).map(
      (entry) => {
        const stock = entry.stocks;

        const sortedPrices = [...(stock?.stock_prices || [])].sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return {
          ticker: stock.ticker,
          company_name: stock.company_name,
          stock_id: entry.stock_id,
          prices: sortedPrices.map((price) => ({
            date: price.date,
            share_price: price.share_price,
          })),
        };
      }
    );

    return NextResponse.json(transformedData);
  } catch (err) {
    console.error("Unexpected error in GET followed stock prices:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
