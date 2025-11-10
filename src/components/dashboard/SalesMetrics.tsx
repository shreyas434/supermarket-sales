import { Card } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { SalesData } from "@/pages/Dashboard";

interface SalesMetricsProps {
  data: SalesData[];
}

export const SalesMetrics = ({ data }: SalesMetricsProps) => {
  const totalSales = data.reduce((sum, item) => sum + parseFloat(item.Total || "0"), 0);
  const totalQuantity = data.reduce((sum, item) => sum + parseInt(item.Quantity || "0"), 0);
  const averageTransaction = totalSales / data.length;
  const uniqueProducts = new Set(data.map(item => item["Product line"])).size;

  const metrics = [
    {
      title: "Total Sales",
      value: `₹${totalSales.toFixed(2)}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Items Sold",
      value: totalQuantity.toString(),
      icon: ShoppingCart,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Avg Transaction",
      value: `₹${averageTransaction.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Product Categories",
      value: uniqueProducts.toString(),
      icon: Package,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="p-6 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="mt-2 text-3xl font-bold">{metric.value}</p>
            </div>
            <div className={`rounded-lg p-3 ${metric.bgColor}`}>
              <metric.icon className={`h-6 w-6 ${metric.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
