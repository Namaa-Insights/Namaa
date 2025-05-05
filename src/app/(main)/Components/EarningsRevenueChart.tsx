"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { EarningsRevenueChartProps } from "@/types/common";
import { formatCurrency } from "@/utils/formatters";
import type { TooltipProps } from "recharts";

export function EarningsRevenueChart({
  revenue,
  costOfRevenue,
  otherExpenses,
}: EarningsRevenueChartProps) {
  const grossProfit = revenue - costOfRevenue;
  const netIncome = grossProfit - otherExpenses;

  const data = [
    {
      label: "Revenue",
      value: revenue,
      actualValue: revenue,
      fill: "#60a5fa",
    },
    {
      label: "Cost of Revenue",
      value: costOfRevenue,
      actualValue: costOfRevenue,
      fill: "#f87171",
    },
    {
      label: "Gross Profit",
      value: grossProfit,
      actualValue: grossProfit,
      fill: "#34d399",
    },
    {
      label: "Other Expenses",
      value: otherExpenses,
      actualValue: otherExpenses,
      fill: "#fb923c",
    },
    {
      label: "Net Income",
      value: netIncome,
      actualValue: netIncome,
      fill: "#818cf8",
    },
  ];

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow text-sm">
          <p className="font-semibold">{item.label}</p>
          <p className="font-SaudiRiyal">{formatCurrency(item.actualValue)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm font-SaudiRiyal">
      <CardHeader>
        <CardTitle className="text-lg">Earnings & Revenue</CardTitle>
        <CardDescription>
          Visual breakdown of revenue, profit, and expenses
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            barGap={8}
            barCategoryGap={30}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#888" />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />
              <span>
                {item.label}: {formatCurrency(item.actualValue)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
