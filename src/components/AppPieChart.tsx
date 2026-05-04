"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";

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

const COLORS = ["var(--color-om)", "var(--color-wave)", "var(--color-paypal)", "var(--color-manuel)", "var(--color-other)"];
const METHODS = ["om", "wave", "paypal", "manuel", "other"];

interface PieChartDataItem {
  method: string;
  dons: number;
  fill?: string;
}

interface AppPieChartProps {
  data?: PieChartDataItem[];
  trend?: string;
  title?: string;
}

const AppPieChart = ({ data, trend, title = "Répartition par méthode" }: AppPieChartProps) => {
  const chartData: PieChartDataItem[] = data && data.length > 0
    ? data.map((item, idx) => ({ ...item, fill: item.fill || COLORS[idx % COLORS.length] }))
    : METHODS.map((m, idx) => ({ method: m, dons: 0, fill: COLORS[idx] }));

  const isEmpty = !data || data.length === 0;
  const totalDons = chartData.reduce((acc, curr) => acc + curr.dons, 0);

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      
      {isEmpty ? (
        <div className="aspect-square max-h-[250px] mx-auto flex flex-col items-center justify-center gap-3 bg-muted/10 rounded-xl border border-dashed" style={{ borderColor: "var(--border)" }}>
          <PieChartIcon size={32} className="text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground italic">Aucune donnée disponible.</p>
        </div>
      ) : (
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
                          {totalDons >= 1000000
                            ? `${(totalDons / 1000000).toFixed(1)}M`
                            : totalDons >= 1000
                            ? `${(totalDons / 1000).toFixed(0)}k`
                            : totalDons.toString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs font-semibold"
                        >
                          FCFA
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      )}

      {!isEmpty && (
        <div className="mt-4 flex flex-col gap-2 items-center">
          {trend && (
            <div className="flex items-center gap-2 font-medium leading-none text-sm">
              {trend} <TrendingUp className="h-4 w-4 text-yessal-success" style={{ color: "var(--yessal-success)" }} />
            </div>
          )}
          <div className="leading-none text-muted-foreground text-sm">
            Cumul des dons sur les 6 derniers mois
          </div>
        </div>
      )}
    </div>
  );
};

export default AppPieChart;
