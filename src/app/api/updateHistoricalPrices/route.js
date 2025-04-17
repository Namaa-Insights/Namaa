import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';


export async function POST(request) {
  const body = await request.formData();
  const date = body.get("date");

  const response = await fetch(`https://script.google.com/macros/s/${process.env.HISTORICAL_PRICES_API_TOKEN}/exec`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ date }),
  });

  const data = await response.json();
  const priceDict = Object.fromEntries(data.map(p => [p.ticker, { price: p.price }]));

  // Return the formatted data
  return new Response(JSON.stringify(priceDict), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  // return Response.json(data);
}


export async function GET() {
  try {
    const supabase = await createClient();
  
    let { data: stocks, error } = await supabase.from("stocks").select("stock_id, ticker");
    
        if (error || !stocks) {
          console.error("❌ Error fetching tickers:", error);
          return NextResponse.json({ message: "Error fetching tickers" }, { status: 500 });
        }
    
    console.log(`📌 Found ${stocks.length} tickers`);
    let errorCount = 0; // Counter for errors

    let currentDate = new Date();
    let date = new Date('2024-10-01T12:00:00');
    currentDate = new Date('2024-10-02T12:00:00');

    // console.log(currentDate)

    while (date < currentDate) {
        const res = await fetch(`${process.env.SITE_URL}/api/updateHistoricalPrices`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ date: `=DATE(${date.getFullYear()}, ${date.getMonth()+1}, ${date.getDay()})` }),
        });
            
        const prices = await res.json();
        // console.log("Prices:", prices);
    
        for (const stock of stocks) {
            const { stock_id, ticker } = stock;
    
            const { data, error } = await supabase.from("stock_prices").insert([
                {
                    stock_id: stock_id,
                    share_price: prices[ticker].price ?? "N/A",
                    date: date,
                },
            ]);
            
            if (error) {
              console.error("Error inserting:", error.message, date, ticker);
            } else {
              console.log(`✅ Inserted stock prices for ${ticker} date ${date}`);
            }
              }    
        // date.setDate(date.getDate() + 1)
        date.setMonth(date.getMonth() + 1)
    }
    } catch (err) {
        return NextResponse.json({ error: err.message || 'Something went wrong' }, { status: 500 })
      }

}