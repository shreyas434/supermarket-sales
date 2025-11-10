import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SalesData } from "@/pages/Dashboard";

interface CategoryChartProps {
  data: SalesData[];
}

export const CategoryChart = ({ data }: CategoryChartProps) => {
  // Group sales by product line
  const salesByCategory = data.reduce((acc, item) => {
    const category = item["Product line"];
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += parseFloat(item.Total || "0");
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByCategory)
    .map(([category, total]) => ({
      category: category.split(" ")[0], // Shorten category names
      sales: parseFloat(total.toFixed(2)),
    }))
    .sort((a, b) => b.sales - a.sales);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Sales by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="category" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px"
            }}
          />
          <Bar dataKey="sales" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
