import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface DashboardChartsProps {
  analytics: {
    totalSales: number;
    totalRevenue: number;
    salesByBranch: Array<{ _id: string; count: number; revenue: number }>;
    salesByCity: Array<{ _id: string; count: number; revenue: number }>;
    salesByCategory: Array<{ _id: string; count: number; revenue: number }>;
    salesByCustomerType: Array<{ _id: string; count: number; revenue: number }>;
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export const DashboardCharts = ({ analytics }: DashboardChartsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Revenue by Branch - Bar Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Revenue by Branch</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.salesByBranch}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="revenue" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Sales by Category - Pie Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Sales by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analytics.salesByCategory}
              dataKey="count"
              nameKey="_id"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {analytics.salesByCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Sales by City - Bar Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Sales Count by City</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.salesByCity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Customer Type Distribution - Pie Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Customer Type Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analytics.salesByCustomerType}
              dataKey="count"
              nameKey="_id"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {analytics.salesByCustomerType.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Revenue Trend by Branch - Line Chart */}
      <Card className="p-6 md:col-span-2">
        <h3 className="text-xl font-bold mb-4">Revenue Trend by Branch</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.salesByBranch}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

