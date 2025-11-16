import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, MapPin, DollarSign, ShoppingCart } from "lucide-react";
import { salesAPI } from "@/api/sales";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { useMemo } from "react";

const CompanyDashboard = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  // Fetch all sales data
  const { data, isLoading, error } = useQuery({
    queryKey: ["sales", "all"],
    queryFn: () => salesAPI.getAll({ page: 1, limit: 10000 }),
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => salesAPI.getAnalytics(),
  });

  // Filter data for this company
  const companyData = useMemo(() => {
    if (!data?.sales || !companyId) return null;

    // Handle main company (default hardcoded data) or uploaded company
    let companySales = data.sales;
    if (companyId === 'main-company') {
      // Default company: sales without companyId
      companySales = data.sales.filter(sale => !sale.companyId);
    } else {
      // Uploaded company: filter by companyId
      companySales = data.sales.filter(sale => sale.companyId === companyId);
    }

    if (companySales.length === 0) return null;

    const totalRevenue = companySales.reduce((sum, sale) => sum + sale.total_price, 0);
    const totalSales = companySales.length;

    // Calculate company-specific analytics
    const salesByCategory = companySales.reduce((acc, sale) => {
      const cat = sale.product_category;
      if (!acc[cat]) {
        acc[cat] = { _id: cat, count: 0, revenue: 0 };
      }
      acc[cat].count++;
      acc[cat].revenue += sale.total_price;
      return acc;
    }, {} as Record<string, { _id: string; count: number; revenue: number }>);

    const salesByCustomerType = companySales.reduce((acc, sale) => {
      const type = sale.customer_type;
      if (!acc[type]) {
        acc[type] = { _id: type, count: 0, revenue: 0 };
      }
      acc[type].count++;
      acc[type].revenue += sale.total_price;
      return acc;
    }, {} as Record<string, { _id: string; count: number; revenue: number }>);

    // Get unique branches and cities for display
    const branches = [...new Set(companySales.map(s => s.branch))];
    const cities = [...new Set(companySales.map(s => s.city))];

    return {
      branch: branches.join(', '),
      city: cities.join(', '),
      name: companyId === 'main-company' ? 'Supermarket Sales Company' : `Branch ${branches[0]} - ${cities[0]}`,
      totalRevenue,
      totalSales,
      sales: companySales,
      analytics: {
        totalSales,
        totalRevenue,
        salesByBranch: branches.map(b => ({
          _id: b,
          count: companySales.filter(s => s.branch === b).length,
          revenue: companySales.filter(s => s.branch === b).reduce((sum, s) => sum + s.total_price, 0)
        })),
        salesByCity: cities.map(c => ({
          _id: c,
          count: companySales.filter(s => s.city === c).length,
          revenue: companySales.filter(s => s.city === c).reduce((sum, s) => sum + s.total_price, 0)
        })),
        salesByCategory: Object.values(salesByCategory),
        salesByCustomerType: Object.values(salesByCustomerType),
      },
    };
  }, [data, companyId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading company dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !companyData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-destructive mb-4">
            Company not found or error loading data.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="mb-2 text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {companyData.name} - Detailed Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for this company
          </p>
        </div>

        {/* Company Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="text-xl font-bold">{companyData.name}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{companyData.totalSales}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${companyData.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-xl font-bold">{companyData.city}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Company-Specific Charts */}
        <DashboardCharts analytics={companyData.analytics} />

        {/* Recent Sales Table */}
        <Card className="p-6 mt-8">
          <h3 className="text-xl font-bold mb-4">Recent Sales</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Unit Price</th>
                  <th className="text-left p-2">Total</th>
                  <th className="text-left p-2">Customer</th>
                </tr>
              </thead>
              <tbody>
                {companyData.sales.slice(0, 10).map((sale) => (
                  <tr key={sale._id} className="border-b">
                    <td className="p-2">{sale.product_name}</td>
                    <td className="p-2">{sale.product_category}</td>
                    <td className="p-2">{sale.quantity}</td>
                    <td className="p-2">${sale.unit_price.toFixed(2)}</td>
                    <td className="p-2 font-semibold">${sale.total_price.toFixed(2)}</td>
                    <td className="p-2">{sale.customer_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDashboard;

