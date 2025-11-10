import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SalesData } from "@/pages/Dashboard";

interface SalesChartProps {
  data: SalesData[];
}

export const SalesChart = ({ data }: SalesChartProps) => {
  // Group sales by date
  const salesByDate = data.reduce((acc, item) => {
    const date = item.Date;
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += parseFloat(item.Total || "0");
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByDate)
    .map(([date, total]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales: parseFloat(total.toFixed(2)),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Daily Sales Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px"
            }}
          />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
