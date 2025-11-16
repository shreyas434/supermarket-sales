import { Sale, SalesResponse, AnalyticsSummary } from '@/types/sales';

const API_BASE = '/api/sales';

export const salesAPI = {
  // GET all sales
  getAll: async (params?: {
    page?: number;
    limit?: number;
    branch?: string;
    city?: string;
    customer_type?: string;
    product_category?: string;
    companyId?: string;
  }): Promise<SalesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.branch) queryParams.append('branch', params.branch);
    if (params?.city) queryParams.append('city', params.city);
    if (params?.customer_type) queryParams.append('customer_type', params.customer_type);
    if (params?.product_category) queryParams.append('product_category', params.product_category);
    if (params?.companyId) queryParams.append('companyId', params.companyId);

    const response = await fetch(`${API_BASE}?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch sales');
    return response.json();
  },

  // GET single sale
  getById: async (id: string): Promise<Sale> => {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch sale');
    return response.json();
  },

  // POST create sale
  create: async (sale: Omit<Sale, '_id' | 'createdAt' | 'updatedAt'> & { companyId?: string }): Promise<Sale> => {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale),
    });
    if (!response.ok) throw new Error('Failed to create sale');
    return response.json();
  },

  // PUT update sale
  update: async (id: string, sale: Partial<Sale> & { companyId?: string }): Promise<Sale> => {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale),
    });
    if (!response.ok) throw new Error('Failed to update sale');
    return response.json();
  },

  // DELETE sale
  delete: async (id: string, companyId?: string): Promise<void> => {
    const url = companyId ? `${API_BASE}/${id}?companyId=${companyId}` : `${API_BASE}/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete sale');
  },

  // GET analytics
  getAnalytics: async (): Promise<AnalyticsSummary> => {
    const response = await fetch(`${API_BASE}/analytics/summary`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },
};

