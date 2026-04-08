"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import type { CategoryBreakdown } from "@/types";

interface Props {
  data: CategoryBreakdown[];
  currency: string;
  title?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function CategoryDonutChart({ data, currency, title = "Expense Breakdown", dateFrom, dateTo }: Props) {
  const router = useRouter();

  const handleClick = (categoryId: number) => {
    const params = new URLSearchParams();
    params.set("categoryId", String(categoryId));
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    router.push(`/transactions?${params}`);
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No expense data available
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: d.categoryName,
    value: Math.round(d.total),
    color: d.categoryColor,
    percentage: d.percentage,
    categoryId: d.categoryId,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              style={{ cursor: "pointer" }}
              onClick={(_, idx) => handleClick(chartData[idx].categoryId)}
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown, name: unknown) => [
                formatCurrency(Number(value), currency),
                String(name),
              ]}
              labelFormatter={() => ""}
            />
            <Legend
              formatter={(value: string) => {
                const item = chartData.find((d) => d.name === value);
                return `${value} (${item?.percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
