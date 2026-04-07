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

const chartConfig = {
  active: {
    label: "Actifs",
    color: "var(--chart-2)",
  },
  new: {
    label: "Nouveaux inscrits",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const chartData = [
  { month: "Janvier", active: 186, new: 80 },
  { month: "Février", active: 305, new: 200 },
  { month: "Mars", active: 237, new: 120 },
  { month: "Avril", active: 73, new: 190 },
  { month: "Mai", active: 209, new: 130 },
  { month: "Juin", active: 214, new: 140 },
];

const AppAreaChart = () => {
  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Évolution des membres</h1>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <AreaChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <defs>
            <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-active)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-active)"
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-new)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-new)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <Area
            dataKey="new"
            type="natural"
            fill="url(#fillNew)"
            fillOpacity={0.4}
            stroke="var(--color-new)"
            stackId="a"
          />
          <Area
            dataKey="active"
            type="natural"
            fill="url(#fillActive)"
            fillOpacity={0.4}
            stroke="var(--color-active)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};

export default AppAreaChart;
