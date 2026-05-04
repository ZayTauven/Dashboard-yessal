"use client";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { BarChart2 } from "lucide-react";

const chartConfig = {
  online: {
    label: "Dons en ligne",
    color: "var(--chart-1)",
  },
  manual: {
    label: "Dons manuels",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const FALLBACK_DATA = [
  { month: "Jan", online: 0, manual: 0 },
  { month: "Fév", online: 0, manual: 0 },
  { month: "Mar", online: 0, manual: 0 },
];

interface BarChartDataItem {
  month: string;
  online?: number;
  manual?: number;
  [key: string]: string | number | undefined;
}

interface AppBarChartProps {
  data?: BarChartDataItem[];
  title?: string;
}

const AppBarChart = ({ data, title = "Jëfs collectés par mois" }: AppBarChartProps) => {
  const chartData = data && data.length > 0 ? data : FALLBACK_DATA;
  const isEmpty = !data || data.length === 0;

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      {isEmpty ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center gap-3 bg-muted/10 rounded-xl border border-dashed" style={{ borderColor: "var(--border)" }}>
          <BarChart2 size={32} className="text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground italic">Aucune donnée disponible pour le moment.</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="online" fill="var(--color-online)" radius={4} />
            <Bar dataKey="manual" fill="var(--color-manual)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
};

export default AppBarChart;
