import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SalesData } from "@/pages/Dashboard";
import { TrendingUp, Package, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PredictiveAnalyticsProps {
  data: SalesData[];
}

export const PredictiveAnalytics = ({ data }: PredictiveAnalyticsProps) => {
  // Calculate daily sales totals
  const dailySales = data.reduce((acc, item) => {
    const date = item.Date;
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += parseFloat(item.Total || "0");
    return acc;
  }, {} as Record<string, number>);

  // Sort dates and prepare historical data
  const sortedDates = Object.keys(dailySales).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  const historicalData = sortedDates.map((date, index) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    actual: parseFloat(dailySales[date].toFixed(2)),
    index,
  }));

  // Simple linear regression for forecasting
  const n = historicalData.length;
  const sumX = historicalData.reduce((sum, item) => sum + item.index, 0);
  const sumY = historicalData.reduce((sum, item) => sum + item.actual, 0);
  const sumXY = historicalData.reduce((sum, item) => sum + item.index * item.actual, 0);
  const sumX2 = historicalData.reduce((sum, item) => sum + item.index * item.index, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Forecast next 7 days
  const forecastDays = 7;
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  const forecastData = Array.from({ length: forecastDays }, (_, i) => {
    const forecastIndex = n + i;
    const forecastValue = slope * forecastIndex + intercept;
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(lastDate.getDate() + i + 1);
    
    return {
      date: forecastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      forecast: parseFloat(Math.max(0, forecastValue).toFixed(2)),
      index: forecastIndex,
    };
  });

  // Combine historical and forecast data
  const chartData = [
    ...historicalData.map(d => ({ date: d.date, actual: d.actual, forecast: null })),
    ...forecastData.map(d => ({ date: d.date, actual: null, forecast: d.forecast })),
  ];

  // Calculate product line metrics for inventory recommendations
  const productMetrics = data.reduce((acc, item) => {
    const product = item["Product line"];
    if (!acc[product]) {
      acc[product] = { totalSales: 0, totalQuantity: 0, transactions: 0 };
    }
    acc[product].totalSales += parseFloat(item.Total || "0");
    acc[product].totalQuantity += parseFloat(item.Quantity || "0");
    acc[product].transactions += 1;
    return acc;
  }, {} as Record<string, { totalSales: number; totalQuantity: number; transactions: number }>);

  // Calculate daily velocity and recommendations
  const daysInDataset = sortedDates.length;
  const inventoryRecommendations = Object.entries(productMetrics)
    .map(([product, metrics]) => {
      const dailyVelocity = metrics.totalQuantity / daysInDataset;
      const avgTransactionSize = metrics.totalQuantity / metrics.transactions;
      const forecastDemand = dailyVelocity * forecastDays;
      const safetyStock = dailyVelocity * 3; // 3 days safety stock
      const reorderPoint = forecastDemand + safetyStock;
      const trend = slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable";
      
      return {
        product,
        dailyVelocity: parseFloat(dailyVelocity.toFixed(2)),
        forecastDemand: Math.ceil(forecastDemand),
        reorderPoint: Math.ceil(reorderPoint),
        trend,
        priority: dailyVelocity > metrics.totalQuantity / daysInDataset ? "high" : "medium",
      };
    })
    .sort((a, b) => b.dailyVelocity - a.dailyVelocity);

  const totalForecastSales = forecastData.reduce((sum, item) => sum + item.forecast, 0);
  const avgDailySales = historicalData.reduce((sum, item) => sum + item.actual, 0) / n;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Trend Direction</h4>
          </div>
          <p className="text-2xl font-bold">
            {slope > 0 ? "↗ Growing" : slope < 0 ? "↘ Declining" : "→ Stable"}
          </p>
          <p className="text-sm text-muted-foreground">
            {slope > 0 ? "+" : ""}{(slope * 10).toFixed(2)} per day
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <h4 className="font-semibold">7-Day Forecast</h4>
          </div>
          <p className="text-2xl font-bold">
            ₹{totalForecastSales.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">
            Avg ₹{(totalForecastSales / forecastDays).toFixed(2)}/day
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-accent" />
            <h4 className="font-semibold">Current Avg Daily</h4>
          </div>
          <p className="text-2xl font-bold">
            ₹{avgDailySales.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">
            Based on {daysInDataset} days
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Sales Forecast (Next 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              name="Historical Sales"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--secondary))"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: "hsl(var(--secondary))", r: 4 }}
              name="Forecasted Sales"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold">Inventory Recommendations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Product Line</th>
                <th className="text-left py-3 px-4 font-semibold">Daily Velocity</th>
                <th className="text-left py-3 px-4 font-semibold">7-Day Demand</th>
                <th className="text-left py-3 px-4 font-semibold">Reorder Point</th>
                <th className="text-left py-3 px-4 font-semibold">Trend</th>
                <th className="text-left py-3 px-4 font-semibold">Priority</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRecommendations.map((item, index) => (
                <tr key={index} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 font-medium">{item.product}</td>
                  <td className="py-3 px-4">{item.dailyVelocity} units/day</td>
                  <td className="py-3 px-4">{item.forecastDemand} units</td>
                  <td className="py-3 px-4 font-semibold text-primary">{item.reorderPoint} units</td>
                  <td className="py-3 px-4">
                    <Badge variant={item.trend === "increasing" ? "default" : item.trend === "decreasing" ? "secondary" : "outline"}>
                      {item.trend === "increasing" ? "↗" : item.trend === "decreasing" ? "↘" : "→"} {item.trend}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                      {item.priority}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          * Reorder Point includes 7-day forecast demand + 3-day safety stock buffer
        </p>
      </Card>
    </div>
  );
};
