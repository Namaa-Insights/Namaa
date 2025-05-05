"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import Loading from "../Components/Loading";
import { formatCurrency } from "@/utils/formatters";
import { Company } from "@/types/common";

type StockResponse = {
  stock_id: number;
  ticker: string;
  company_name: string;
  latest_price: {
    price: string;
    open: string;
    high: string;
    low: string;
    volume: string;
    marketcap: string;
  };
  shares_outstanding: string;
  oneMonthAgoPrice: string;
  oneYearAgoPrice: string;
  is_followed: boolean;
};

export default function CompaniesPage() {
  const router = useRouter();
  const [followed, setFollowed] = useState<Company[]>([]);
  const [notFollowed, setNotFollowed] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Company | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  useEffect(() => {
    const fetchStocksData = async () => {
      try {
        const response = await fetch("/api/fetchStocks");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const stocksData = await response.json();

        const companies: Company[] = stocksData.map((stock: StockResponse) => {
          const latestPrice = stock.latest_price || {
            price: "0",
            open: "0",
            high: "0",
            low: "0",
            volume: "0",
            marketcap: "0",
          };

          const sharePrice = parseFloat(latestPrice.price) || 0;
          const openPrice = parseFloat(latestPrice.open) || 0;
          const highPrice = parseFloat(latestPrice.high) || 0;
          const lowPrice = parseFloat(latestPrice.low) || 0;
          const volume = parseFloat(latestPrice.volume) || 0;
          const marketcap = parseFloat(latestPrice.marketcap) || 0;

          const change30D = calculatePriceChange(latestPrice.price, stock.oneMonthAgoPrice);
          const change1Y = calculatePriceChange(latestPrice.price, stock.oneYearAgoPrice);
          const changeToday = calculatePriceChange(latestPrice.price, latestPrice.open);

          return {
            id: stock.stock_id,
            ticker: stock.ticker,
            name: stock.company_name,
            marketCap: formatCurrency(marketcap),
            price: formatCurrency(sharePrice),
            open: formatCurrency(openPrice),
            high: formatCurrency(highPrice),
            low: formatCurrency(lowPrice),
            volume: formatCurrency(volume),
            change30D,
            change1Y,
            changeToday,
            category: stock.is_followed ? "followed" : "notFollowed",
          };
        });

        setFollowed(companies.filter((c) => c.category === "followed"));
        setNotFollowed(companies.filter((c) => c.category === "notFollowed"));
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load stock data");
        setLoading(false);
      }
    };

    fetchStocksData();
  }, []);

  const calculatePriceChange = (strLatestPrice: string, strHistoricalPrice: string): string => {
    if (!strLatestPrice || !strHistoricalPrice) return "0%";
    const latestPrice = Number.parseFloat(strLatestPrice);
    const historicalPrice = Number.parseFloat(strHistoricalPrice);
    const change = ((latestPrice - historicalPrice) / historicalPrice) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  const handleRowClick = (companyId: number) => {
    router.push(`/analysis/${companyId}`);
  };

  const handleFollowToggle = async (company: Company) => {
    try {
      const endpoint =
        company.category === "followed"
          ? "/api/unfollowStock"
          : "/api/followStock";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock_id: company.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update follow status");
      }

      if (company.category === "followed") {
        setFollowed((prev) => prev.filter((c) => c.id !== company.id));
        setNotFollowed((prev) => [
          ...prev,
          { ...company, category: "notFollowed" },
        ]);
      } else {
        setNotFollowed((prev) => prev.filter((c) => c.id !== company.id));
        setFollowed((prev) => [...prev, { ...company, category: "followed" }]);
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
    }
  };

  const handleSort = (key: keyof Company) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const renderSortArrow = (key: keyof Company) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const sortCompanies = (companies: Company[]) => {
    const { key, direction } = sortConfig;
    if (!key) return companies;

    return [...companies].sort((a, b) => {
      const aVal = a[key] || "";
      const bVal = b[key] || "";

      const aNum = Number(aVal.toString().replace(/[^0-9.-]+/g, ""));
      const bNum = Number(bVal.toString().replace(/[^0-9.-]+/g, ""));

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return direction === "asc" ? aNum - bNum : bNum - aNum;
      }

      return direction === "asc"
        ? aVal.toString().localeCompare(bVal.toString())
        : bVal.toString().localeCompare(aVal.toString());
    });
  };

  const filteredFollowed = sortCompanies(
    followed.filter((company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  const filteredNotFollowed = sortCompanies(
    notFollowed.filter((company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const renderTable = (stocks: Company[], title: string) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-300 underline decoration-blue-300 dark:decoration-gray-600 decoration-2 underline-offset-8">
        {title}
      </h2>
      <div className="overflow-x-auto rounded-lg shadow-md bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {[
                { key: "name", label: "Name" },
                { key: "marketCap", label: "Market Cap" },
                { key: "price", label: "Price" },
                { key: "open", label: "Open" },
                { key: "high", label: "High" },
                { key: "low", label: "Low" },
                { key: "volume", label: "Volume" },
                { key: "change30D", label: "30D" },
                { key: "change1Y", label: "1Y" },
                { key: "changeToday", label: "Today" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key as keyof Company)}
                  className="px-3 py-3 text-left text-gray-500 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-center align-middle"
                >
                  {col.label} {renderSortArrow(col.key as keyof Company)}
                </th>
              ))}
              <th className="px-3 py-3 text-left text-gray-500 dark:text-gray-300 text-center align-middle">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {stocks.map((company) => (
              <tr
                key={company.id}
                onClick={() => handleRowClick(company.id)}
                className="hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <td className="font-SaudiRiyal px-3 py-4">{company.name}</td>
                <td className="font-SaudiRiyal px-3 py-4 text-center">{company.marketCap}</td>
                <td className="font-SaudiRiyal px-3 py-4 text-center">{company.price}</td>
                <td className="font-SaudiRiyal px-3 py-4 text-center">{company.open}</td>
                <td className="font-SaudiRiyal px-3 py-4 text-center">{company.high}</td>
                <td className="font-SaudiRiyal px-3 py-4 text-center">{company.low}</td>
                <td className="font-SaudiRiyal px-3 py-4 text-center">{company.volume}</td>
                <td
                  className={`px-3 py-4 text-center ${
                    company.change30D.startsWith("+")
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {company.change30D}
                </td>
                <td
                  className={`px-3 py-4 text-center ${
                    company.change1Y.startsWith("+")
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {company.change1Y}
                </td>
                <td
                  className={`px-3 py-4 text-center ${
                    company.changeToday.startsWith("+")
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {company.changeToday}
                </td>
                <td className="px-3 py-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowToggle(company);
                    }}
                    className="text-2xl transition-colors"
                  >
                    {company.category === "followed" ? (
                      <FaHeart className="text-red-500 hover:text-red-600" />
                    ) : (
                      <FaRegHeart className="text-gray-400 hover:text-pink-500" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) return <Loading />;
  if (error)
    return (
      <div className="p-4 text-center text-red-500 dark:text-red-400">
        {error}
      </div>
    );

  return (
    <div className="p-4 bg-slate-100 dark:bg-gray-900 min-h-screen">
      <div className="mb-6 flex items-center w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm border border-transparent focus-within:border-blue-500">
        <svg
          className="w-5 h-5 text-blue-400 mr-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search for something"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent w-full outline-none text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {renderTable(filteredFollowed, "Followed Stocks")}
      {renderTable(filteredNotFollowed, "Stocks")}
    </div>
  );
}
