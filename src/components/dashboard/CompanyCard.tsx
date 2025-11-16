import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign, TrendingUp, Trash2, BarChart3 } from "lucide-react";
import { Sale } from "@/types/sales";

interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    branch: string;
    city: string;
    totalRevenue: number;
    totalSales: number;
    sales: Sale[];
    companyId?: string;
  };
  onClick: () => void;
  onDelete?: (id: string) => void;
  isSelected: boolean;
}

export const CompanyCard = ({ company, onClick, onDelete, isSelected }: CompanyCardProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't allow deleting example company
    if (company.name.includes('(Example)')) {
      return;
    }
    if (onDelete && confirm(`Are you sure you want to delete "${company.name}" and all its data?`)) {
      onDelete(company.id);
    }
  };
  
  const isExample = company.name.includes('(Example)');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card
      className={`p-6 transition-all hover:shadow-lg relative ${
        isSelected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={onClick}
        >
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{company.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{company.city || 'N/A'}</span>
            </div>
          </div>
        </div>
        {onDelete && !isExample && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        {isExample && (
          <div className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md font-medium">
            Example
          </div>
        )}
      </div>

      <div 
        className="grid grid-cols-2 gap-4 mt-4 cursor-pointer"
        onClick={onClick}
      >
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
          <p className="text-2xl font-bold">{company.totalSales.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10">
          <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(company.totalRevenue)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{company.branch || 'N/A'}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            View Dashboard
          </Button>
        </div>
      </div>
    </Card>
  );
};


