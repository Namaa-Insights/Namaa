"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import Loading from "./Loading";

interface TrendingStock {
  name: string;
  ticker: string;
  high: number;
  low: number;
  delta: number;
  price: string;
}

interface StockApiResponse {
  company_name: string;
  ticker: string;
  latest_price?: {
    price?: string;
    high?: string;
    low?: string;
  };
}

export default function TopTrendingStocks() {
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch("/api/fetchStocks");
        const data: StockApiResponse[] = await res.json();

        const trendingStocks = data
          .map((stock: StockApiResponse) => {
            const high = parseFloat(stock.latest_price?.high ?? "0");
            const low = parseFloat(stock.latest_price?.low ?? "0");
            const delta = parseFloat((high - low).toFixed(2));

            return {
              name: stock.company_name,
              ticker: stock.ticker,
              high,
              low,
              delta,
              price: formatCurrency(parseFloat(stock.latest_price?.price ?? "0")),
            };
          })
          .filter((stock) => stock.high && stock.low)
          .sort((a, b) => b.delta - a.delta)
          .slice(0, 10);

        setTrending(trendingStocks);
      } catch (err) {
        console.error("Error fetching trending stocks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div className="max-w-xl overflow-x-auto shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-300 underline decoration-blue-300 dark:decoration-gray-600 decoration-2 underline-offset-8">
        Top 10 Trending Stocks
      </h2>
      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Company</th>
            <th className="px-4 py-2 text-right">Price</th>
            <th className="px-4 py-2 text-right">High - Low</th>
          </tr>
        </thead>
        <tbody>
          {trending.map((stock) => (
            <tr
              key={stock.ticker}
              className="text-center border-t dark:border-gray-600 font-SaudiRiyal"
            >
              <td className="px-4 py-2 text-left">{stock.name}</td>
              <td className="px-4 py-2 text-right">{stock.price}</td>
              <td
                className={`px-4 py-2 text-right ${
                  stock.delta >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(stock.delta)}
              </td>
            </tr>
          ))}
          {trending.length === 0 && (
            <tr>
              <td colSpan={3} className="p-6 text-center text-gray-500">
                <Loading />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
