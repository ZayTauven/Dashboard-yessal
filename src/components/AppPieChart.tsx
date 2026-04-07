"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import { TrendingUp } from "lucide-react";

const chartConfig = {
  dons: {
    label: "Dons",
  },
  om: {
    label: "Orange Money",
    color: "var(--chart-1)",
  },
  wave: {
    label: "Wave",
    color: "var(--chart-2)",
  },
  paypal: {
    label: "PayPal",
    color: "var(--chart-3)",
  },
  manuel: {
    label: "Espèces (Manuel)",
    color: "var(--chart-4)",
  },
  other: {
    label: "Autre",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const chartData = [
  { method: "om", dons: 2750000, fill: "var(--color-om)" },
  { method: "wave", dons: 3200000, fill: "var(--color-wave)" },
  { method: "paypal", dons: 850000, fill: "var(--color-paypal)" },
  { method: "manuel", dons: 4100000, fill: "var(--color-manuel)" },
  { method: "other", dons: 190000, fill: "var(--color-other)" },
];

const AppPieChart = () => {

  // If you don't use React compiler use useMemo hook to improve performance
  const totalDons = chartData.reduce((acc, curr) => acc + curr.dons, 0);
  
  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Répartition par méthode</h1>
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[250px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="dons"
            nameKey="method"
            innerRadius={60}
            strokeWidth={5}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-2xl font-bold"
                      >
                        {(totalDons / 1000000).toFixed(1)}M
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground text-xs font-semibold"
                      >
                        FCFA Collectés
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="mt-4 flex flex-col gap-2 items-center">
        <div className="flex items-center gap-2 font-medium leading-none">
          En hausse de 12.5% ce mois <TrendingUp className="h-4 w-4 text-yessal-success" />
        </div>
        <div className="leading-none text-muted-foreground text-sm">
          Cumul des dons sur les 6 derniers mois
        </div>
      </div>
    </div>
  );
};

export default AppPieChart;
