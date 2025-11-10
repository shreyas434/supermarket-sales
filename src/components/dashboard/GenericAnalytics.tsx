import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Hash } from "lucide-react";

interface GenericAnalyticsProps {
  data: Record<string, string>[];
  columns: string[];
}

export const GenericAnalytics = ({ data, columns }: GenericAnalyticsProps) => {
  // Detect numeric columns
  const numericColumns = columns.filter((col) => {
    const firstValue = data[0]?.[col];
    return firstValue && !isNaN(parseFloat(firstValue));
  });

  // Calculate stats for numeric columns
  const columnStats = numericColumns.map((col) => {
    const values = data
      .map((row) => parseFloat(row[col] || "0"))
      .filter((val) => !isNaN(val));
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      column: col,
      sum: sum.toFixed(2),
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      count: values.length,
    };
  });

  // Get top values for first text column (categories)
  const textColumns = columns.filter((col) => !numericColumns.includes(col));
  const firstTextColumn = textColumns[0];
  const firstNumericColumn = numericColumns[0];

  let categoryData: { category: string; value: number }[] = [];

  if (firstTextColumn && firstNumericColumn) {
    const grouped = data.reduce((acc, row) => {
      const category = row[firstTextColumn] || "Unknown";
      const value = parseFloat(row[firstNumericColumn] || "0");
      if (!acc[category]) acc[category] = 0;
      acc[category] += value;
      return acc;
    }, {} as Record<string, number>);

    categoryData = Object.entries(grouped)
      .map(([category, value]) => ({ category, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  return (
    <div className="space-y-6">
      {/* Numeric Column Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columnStats.slice(0, 4).map((stat, index) => (
          <Card key={index} className="p-6 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.column}</p>
                <p className="mt-2 text-3xl font-bold">{stat.sum}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {stat.avg} | Range: {stat.min}-{stat.max}
                </p>
              </div>
              <div className="rounded-lg p-3 bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Category Chart */}
      {categoryData.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Top {firstTextColumn} by {firstNumericColumn}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="category" className="text-xs" angle={-45} textAnchor="end" height={100} />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* All Numeric Columns Stats */}
      {columnStats.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Numeric Column Statistics</h3>
          <div className="space-y-4">
            {columnStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <div>
                  <p className="font-medium">{stat.column}</p>
                  <p className="text-sm text-muted-foreground">
                    {stat.count} values
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Total: {stat.sum}</p>
                  <p className="text-sm text-muted-foreground">
                    Avg: {stat.avg} | Min: {stat.min} | Max: {stat.max}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
