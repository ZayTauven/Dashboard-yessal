"use client";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

const chartConfig = {
  total: {
    label: "Montant",
    color: "var(--yessal-green)",
  },
  active: {
    label: "Actifs",
    color: "var(--chart-2)",
  },
  new: {
    label: "Nouveaux",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface AppAreaChartProps {
  data?: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
  nameKey?: string;
  dataKey?: string;
}

const AppAreaChart = ({ 
  data, 
  title = "Évolution", 
  subtitle,
  nameKey = "name",
  dataKey = "total" 
}: AppAreaChartProps) => {
  const chartData = data && data.length > 0 ? data : [];
  const isEmpty = chartData.length === 0;

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      {isEmpty ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center gap-3 bg-muted/10 rounded-xl border border-dashed" style={{ borderColor: "var(--border)" }}>
          <TrendingUp size={32} className="text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground italic">Aucune donnée historique disponible.</p>
        </div>
      ) : (
        <>
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <AreaChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey={nameKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <YAxis 
                tickLine={false} 
                tickMargin={10} 
                axisLine={false}
                tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <defs>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--yessal-green)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--yessal-green)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-active)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-active)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-new)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-new)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              {chartData[0]?.new !== undefined && (
                <Area
                  dataKey="new"
                  type="natural"
                  fill="url(#fillNew)"
                  fillOpacity={0.4}
                  stroke="var(--color-new)"
                  stackId="a"
                />
              )}
              {chartData[0]?.active !== undefined && (
                <Area
                  dataKey="active"
                  type="natural"
                  fill="url(#fillActive)"
                  fillOpacity={0.4}
                  stroke="var(--color-active)"
                  stackId="a"
                />
              )}
              {chartData[0]?.[dataKey] !== undefined && chartData[0]?.new === undefined && (
                <Area
                  dataKey={dataKey}
                  type="monotone"
                  fill="url(#fillTotal)"
                  fillOpacity={1}
                  stroke="var(--yessal-green)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ChartContainer>
          {subtitle && (
            <p className="text-xs text-center text-muted-foreground mt-3">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
};

export default AppAreaChart;
