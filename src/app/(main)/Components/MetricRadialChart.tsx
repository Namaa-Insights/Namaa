"use client";

import { LabelList, RadialBar, RadialBarChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MetricRadialChartProps } from '@/types/common'

const format = (v: number | null) =>
  typeof v === "number" && !isNaN(v) ? Number(v.toFixed(2)) : 0;

export function MetricRadialChart({
  title,
  description = "Company vs Sector vs Market",
  company,
  sector,
  market,
  isPercentage = false,
}: MetricRadialChartProps) {
  const chartData = [
    {
      name: "This Company",
      value: format(isPercentage ? company! * 100 : company),
      fill: "hsl(var(--chart-1))",
    },
    {
      name: "Sector Avg",
      value: format(isPercentage ? sector! * 100 : sector),
      fill: "hsl(var(--chart-2))",
    },
    {
      name: "Market Avg",
      value: format(isPercentage ? market! * 100 : market),
      fill: "hsl(var(--chart-3))",
    },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          className="mx-auto aspect-square max-h-[250px]"
          config={{}}
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={450}
            innerRadius={30}
            outerRadius={110}
            barSize={12}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <RadialBar dataKey="value" background>
              <LabelList
                dataKey="name"
                position="insideStart"
                className="fill-white capitalize"
                fontSize={11}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Showing: {title}
      </CardFooter>
    </Card>
  );
}
