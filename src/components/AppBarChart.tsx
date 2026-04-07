"use client";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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

const chartData = [
  { month: "Janvier", online: 186000, manual: 80000 },
  { month: "Février", online: 305000, manual: 200000 },
  { month: "Mars", online: 237000, manual: 120000 },
  { month: "Avril", online: 73000, manual: 190000 },
  { month: "Mai", online: 209000, manual: 130000 },
  { month: "Juin", online: 214000, manual: 140000 },
];

const AppBarChart = () => {
  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Dons collectés par mois</h1>
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
    </div>
  );
};

export default AppBarChart;
