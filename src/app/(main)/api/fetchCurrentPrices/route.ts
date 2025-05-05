export async function POST() {
    const response = await fetch(`https://script.google.com/macros/s/${process.env.CURRENT_PRICES_API_TOKEN}/exec`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  
    const data = await response.json();
    const priceDict = Object.fromEntries(data.map((p: {ticker: string, price: number, open: number, high: number, low: number, volume: number, marketcap: number}) => [p.ticker, { price: p.price, open:p.open, high:p.high, low:p.low, volume: p.volume, marketcap: p.marketcap }]));

      return new Response(JSON.stringify(priceDict), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  }
  