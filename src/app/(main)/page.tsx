"use client";

import { useEffect, useState } from "react";
import Loading from "./Components/Loading";
import StockTable from "./Components/StockTable";
import TopTrendingStocks from "@/app/(main)/Components/TopTrendingStocks";
import { Article, Stock } from '@/types/common';
import DashboardNews from "./Components/DashboardNews";
import FollowedStockPriceChart from "./Components/FollowedStockPriceChart";

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [, setNews] = useState<Article[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(true);

  const loading = newsLoading || stockLoading;

  useEffect(() => {
    const fetchFollowNews = async () => {
      try {
        const res = await fetch("/api/fetchNews");
        const data = await res.json();
        setNews(data);
      } catch (err) {
        console.error("Error fetching followed news:", err);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchFollowNews();
  }, []);

  useEffect(() => {
    const fetchFollowedStocks = async () => {
      try {
        const res = await fetch("/api/followStock");
        const data = await res.json();
        if (res.ok) setPortfolio(data);
      } catch (err) {
        console.error("Failed to fetch stocks:", err);
      } finally {
        setStockLoading(false);
      }
    };
    fetchFollowedStocks();
  }, []);

  const handleUpdateStocks = async (stocksToUpdate: Stock[]) => {
    try {
      const updatePromises = stocksToUpdate.map(stock => 
        fetch("/api/updateStockCount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: stock.ticker, number_of_stocks: stock.number_of_stocks }),
        })
      );

      const responses = await Promise.all(updatePromises);

      const allSuccessful = responses.every(res => res.ok);
      return allSuccessful;
    } catch (err) {
      console.error("Error updating stocks:", err);
      return false;
    }
  };

  return (
    <div className="p-8 bg-slate-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-300 underline decoration-blue-300 dark:decoration-gray-600 decoration-2 underline-offset-8">
        Dashboard
      </h2>

      {loading ? (
        <Loading />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2 w-full">
            <FollowedStockPriceChart />
            <DashboardNews stocks={portfolio} />
            </div>
          <div className="lg:w-1/2 w-full">
            <StockTable stocks={portfolio} onSaveAll={handleUpdateStocks} />
          </div>
          <div className="lg:w-1/2 w-full">
            <TopTrendingStocks />
          </div>
        </div>
      )}
    </div>
  );
}
