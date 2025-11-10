import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { SalesData } from "@/pages/Dashboard";

interface TopProductsProps {
  data: SalesData[];
}

export const TopProducts = ({ data }: TopProductsProps) => {
  // Calculate total sales by product line
  const salesByProduct = data.reduce((acc, item) => {
    const product = item["Product line"];
    if (!acc[product]) {
      acc[product] = { total: 0, quantity: 0 };
    }
    acc[product].total += parseFloat(item.Total || "0");
    acc[product].quantity += parseInt(item.Quantity || "0");
    return acc;
  }, {} as Record<string, { total: number; quantity: number }>);

  const topProducts = Object.entries(salesByProduct)
    .map(([product, stats]) => ({
      product,
      total: stats.total,
      quantity: stats.quantity,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Top 5 Best-Selling Products
      </h3>
      <div className="space-y-4">
        {topProducts.map((product, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                {index + 1}
              </div>
              <div>
                <p className="font-medium">{product.product}</p>
                <p className="text-sm text-muted-foreground">
                  {product.quantity} items sold
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">₹{product.total.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
