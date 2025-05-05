"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Stock } from "@/types/common";
import { formatCurrency } from "@/utils/formatters";

interface StockTableProps {
  stocks: Stock[];
  onSaveAll: (stocksToUpdate: Stock[]) => Promise<boolean>;
}

export default function StockTable({ stocks, onSaveAll }: StockTableProps) {
  const [localStocks, setLocalStocks] = useState<Stock[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error" | "saving">("idle");

  useEffect(() => {
    setLocalStocks(stocks);
  }, [stocks]);

  const handleChange = (ticker: string, value: number) => {
    setLocalStocks((prev) =>
      prev.map((stock) =>
        stock.ticker === ticker ? { ...stock, number_of_stocks: value } : stock
      )
    );
  };

  const handleSaveAll = async () => {
    setSaveStatus("saving");
    const result = await onSaveAll(localStocks);
    setSaveStatus(result ? "success" : "error");
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  return (
    <div className="max-w-xl overflow-x-auto shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-300 underline decoration-blue-300 dark:decoration-gray-600 decoration-2 underline-offset-8">
        My Stocks
      </h2>
      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-2">Company</th>
            <th className="px-4 py-2">Price</th>
            <th className="px-4 py-2"># of Stocks</th>
          </tr>
        </thead>
        <tbody>
          {localStocks.length > 0 ? (
            localStocks.map((item, index) => (
              <tr
                key={index}
                className="text-center border-t dark:border-gray-600 font-SaudiRiyal"
              >
                <td className="px-4 py-2">{item.company_name}</td>
                <td className="px-4 py-2">{formatCurrency(item.share_price)}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    value={item.number_of_stocks}
                    onChange={(e) =>
                      handleChange(item.ticker, parseInt(e.target.value) || 0)
                    }
                    className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center"
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="p-6 text-center text-gray-500">
                You haven&rsquo;t followed any stocks yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {localStocks.length > 0 && (
        <div className="flex flex-col items-center mt-4">
          <Button
            onClick={handleSaveAll}
            disabled={saveStatus === "saving"}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
          >
            {saveStatus === "saving" ? "Saving..." : "Save All Changes"}
          </Button>

          {saveStatus === "success" && (
            <p className="mt-2 text-green-600 font-medium">Stocks updated successfully!</p>
          )}
          {saveStatus === "error" && (
            <p className="mt-2 text-red-600 font-medium">Failed to update stocks. Try again.</p>
          )}
        </div>
      )}
    </div>
  );
}
