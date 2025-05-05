// components/StockRiskTable.tsx
import { StockRisk } from '@/types/common'

const riskColors = {
  Low: "bg-green-200 text-green-700",
  Medium: "bg-yellow-200 text-yellow-700",
  High: "bg-red-200 text-red-700",
};

export default function StockRiskTable({ stocks }: {stocks:StockRisk[]}) {
  const groupedStocks = stocks.reduce((acc: Record<string, StockRisk[]>, stock) => {
    acc[stock.risk] = acc[stock.risk] || [];
    acc[stock.risk].push(stock);
    return acc;
  }, {});

  return (
    <div className="grid gap-6 md:grid-cols-3 p-4">
      {(["Low", "Medium", "High"] as const).map((risk) => (
        <div
          key={risk}
          className="rounded-2xl shadow-md bg-gray-100 dark:bg-gray-700"
        >
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>{risk} Risk</span>
              <span className={`text-sm px-2 py-1 rounded ${riskColors[risk]}`}>
                {groupedStocks[risk]?.length || 0} Stocks
              </span>
            </h2>
            <ul className="space-y-3">
              {groupedStocks[risk]?.map((stock) => (
                <li
                  key={stock.ticker}
                  className="border p-3 bg-white dark:bg-gray-600 border-white dark:border-gray-600 rounded-lg hover:shadow transition-all flex flex-col"
                >
                  <span className="font-medium">{stock.name}</span>
                  <div className="text-sm text-muted-foreground">
                    {stock.ticker} • {stock.sector}
                  </div>
                </li>
              )) || <p className="text-sm text-muted-foreground">No stocks</p>}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
