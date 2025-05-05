"use client";

import MetricCard  from "./MetricCard";
import { MetricBarChart } from "./MetricBarChart";
import { Button } from "@/components/ui/button";
import { MetricToggleBlockProps } from '@/types/common'

export const MetricToggleBlock = ({
  title,
  value,
  sector,
  market,
  isPercentage,
  view,
  onToggle,
}: MetricToggleBlockProps) => {
  return (
    <div className="relative">
      {view === "chart" ? (
        <MetricBarChart
          title={title}
          company={value}
          sector={sector}
          market={market}
          isPercentage={isPercentage}
        />
      ) : (
        <MetricCard title={title} value={value} />
      )}

      {onToggle && (
        <div className="absolute top-2 right-2">
          <Button size="sm" variant="ghost" onClick={onToggle}>
            {view === "card" ? "Chart" : "Card"}
          </Button>
        </div>
      )}
    </div>
  );
};
