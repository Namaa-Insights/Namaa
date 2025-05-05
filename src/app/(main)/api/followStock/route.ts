import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// -------------------
// Type Declarations
// -------------------

type StockPrice = {
  date: string;
  share_price: number;
};

type Financials = {
  total_assets: number;
  total_debt: number;
};

type StockWithDetails = {
  ticker: string;
  company_name: string;
  sector: string;
  stock_prices: StockPrice[];
  financials: Financials[];
};

type FollowedStockRecord = {
  stock_id: number;
  number_of_stocks: number;
  stocks: StockWithDetails;
};

// -------------------
// POST: Follow a Stock
// -------------------

export async function POST(request: Request) {
  try {
    const { stock_id } = await request.json();

    if (!stock_id) {
      return NextResponse.json(
        { error: "stock_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

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

    const { error } = await supabase
      .from("user_follows")
      .insert({ user_id, stock_id });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Followed successfully" });
  } catch (err) {
    console.error("Unexpected error in followStock:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// -------------------
// GET: Followed Stocks with Latest Price & Financials
// -------------------

export async function GET() {
  try {
    const supabase = await createClient();

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

    const { data: followedStocks, error } = await supabase
      .from("user_follows")
      .select(
        `
        number_of_stocks,
        stock_id,
        stocks(
          ticker,
          company_name,
          sector,
          stock_prices(share_price, date),
          financials(total_assets, total_debt)
        )
      `
      )
      .eq("user_id", user_id);

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!followedStocks) {
      return NextResponse.json([], { status: 200 });
    }

    const transformed = (followedStocks as FollowedStockRecord[]).map(
      (entry) => {
        const stock = entry.stocks;

        const sortedPrices = [...(stock?.stock_prices ?? [])].sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const latestPrice = sortedPrices[0] || {};
        const financials = stock?.financials?.[0] || {};

        return {
          ticker: stock.ticker,
          company_name: stock.company_name,
          sector: stock.sector,
          share_price: latestPrice.share_price,
          number_of_stocks: entry.number_of_stocks,
          total_assets: financials.total_assets,
          total_debt: financials.total_debt,
        };
      }
    );

    return NextResponse.json(transformed);
  } catch (err) {
    console.error("Unexpected error in GET followed stocks:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
