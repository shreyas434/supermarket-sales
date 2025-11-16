import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Upload,
} from "lucide-react";
import { salesAPI } from "@/api/sales";
import { uploadAPI } from "@/api/upload";
import { toast } from "sonner";
import { Sale } from "@/types/sales";
import { CompanyCard } from "@/components/dashboard/CompanyCard";
import { CRUDPanel } from "@/components/dashboard/CRUDPanel";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { CSVUpload } from "@/components/upload/CSVUpload";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Fetch companies
  const { data: companiesData } = useQuery({
    queryKey: ["companies"],
    queryFn: () => uploadAPI.getCompanies(),
  });

  // State for company sales data
  const [companySalesMap, setCompanySalesMap] = useState<Record<string, Sale[]>>({});

  // Fetch sales for each company
  useEffect(() => {
    const fetchCompanySales = async () => {
      if (!companiesData) return;
      
      const salesMap: Record<string, Sale[]> = {};
      
      for (const company of companiesData) {
        try {
          const salesResponse = await salesAPI.getAll({ 
            page: 1, 
            limit: 10000, 
            companyId: company.isDefault ? 'main-company' : company._id 
          });
          salesMap[company.isDefault ? 'main-company' : company._id] = salesResponse.sales || [];
        } catch (error) {
          console.error(`Error fetching sales for company ${company.name}:`, error);
          salesMap[company.isDefault ? 'main-company' : company._id] = [];
        }
      }
      
      setCompanySalesMap(salesMap);
    };
    
    fetchCompanySales();
  }, [companiesData]);

  // Group companies: default (example) + uploaded companies
  const companies = useMemo(() => {
    const result: Array<{
      id: string;
      name: string;
      branch: string;
      city: string;
      totalRevenue: number;
      totalSales: number;
      sales: Sale[];
      companyId?: string;
    }> = [];

    if (!companiesData) return result;

    companiesData.forEach((company) => {
      const companyId = company.isDefault ? 'main-company' : company._id;
      const companySales = companySalesMap[companyId] || [];
      
      if (companySales.length > 0) {
        const branches = [...new Set(companySales.map(s => s.branch).filter(Boolean))];
        const cities = [...new Set(companySales.map(s => s.city).filter(Boolean))];
        const totalRevenue = companySales.reduce((sum, sale) => sum + (sale.total_price || 0), 0);
        
        result.push({
          id: companyId,
          name: company.isDefault ? `${company.name} (Example)` : company.name,
          branch: branches.join(', ') || 'N/A',
          city: cities.join(', ') || 'N/A',
          totalRevenue,
          totalSales: companySales.length,
          sales: companySales,
          companyId: company.isDefault ? null : company._id,
        });
      }
    });

    return result;
  }, [companiesData, companySalesMap]);

  const selectedCompanyData = useMemo(() => {
    if (!selectedCompany) return null;
    return companies.find((c) => c.id === selectedCompany) || null;
  }, [selectedCompany, companies]);

  const handleDeleteCompany = async (companyId: string) => {
    try {
      await uploadAPI.deleteCompany(companyId);
      toast.success("Company deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      if (selectedCompany === companyId) {
        setSelectedCompany(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete company");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-destructive">
            Error loading data. Please check your backend connection.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">


        {/* Upload Section */}
        {showUpload && (
          <div className="mt-8 mb-8">
            <CSVUpload onClose={() => setShowUpload(false)} />
          </div>
        )}

        {/* Company Card Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Companies</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowUpload(!showUpload)}
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {showUpload ? "Cancel Upload" : "Upload CSV"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedCompany(null)}
                disabled={!selectedCompany}
              >
                Clear Selection
              </Button>
            </div>
          </div>

          {companies.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No data found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Import data using: npm run import (in backend folder)
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onClick={() => setSelectedCompany(company.id)}
                  onDelete={handleDeleteCompany}
                  isSelected={selectedCompany === company.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* CRUD Panel */}
        {selectedCompanyData && (
          <CRUDPanel
            company={selectedCompanyData}
            onClose={() => setSelectedCompany(null)}
          />
        )}

        {/* Individual Dashboard Button */}
        {selectedCompanyData && (
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  View Detailed Dashboard for {selectedCompanyData.name}
                </h3>
                <p className="text-muted-foreground">
                  Get comprehensive analytics and insights for this company
                </p>
              </div>
              <Button
                onClick={() => navigate(`/dashboard/company/${selectedCompanyData.id}`)}
                className="gap-2"
              >
                View Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
