export interface Sale {
  _id?: string;
  sale_id: number;
  branch: string;
  city: string;
  customer_type: string;
  gender: string;
  product_name: string;
  product_category: string;
  unit_price: number;
  quantity: number;
  tax: number;
  total_price: number;
  reward_points: number;
  companyId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesResponse {
  sales: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AnalyticsSummary {
  totalSales: number;
  totalRevenue: number;
  salesByBranch: Array<{ _id: string; count: number; revenue: number }>;
  salesByCity: Array<{ _id: string; count: number; revenue: number }>;
  salesByCategory: Array<{ _id: string; count: number; revenue: number }>;
  salesByCustomerType: Array<{ _id: string; count: number; revenue: number }>;
}

