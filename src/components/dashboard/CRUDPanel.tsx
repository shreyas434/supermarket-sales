import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Sale } from "@/types/sales";
import { salesAPI } from "@/api/sales";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface CRUDPanelProps {
  company: {
    id: string;
    name: string;
    branch: string;
    city: string;
    sales: Sale[];
    companyId?: string;
  };
  onClose: () => void;
}

export const CRUDPanel = ({ company, onClose }: CRUDPanelProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState<Partial<Sale>>({
    branch: "",
    city: "",
    customer_type: "",
    gender: "",
    product_name: "",
    product_category: "",
    unit_price: 0,
    quantity: 0,
    tax: 0,
    total_price: 0,
    reward_points: 0,
  });

  const queryClient = useQueryClient();

  // Determine the correct companyId for queries
  // For uploaded companies: use company.companyId (MongoDB _id)
  // For main/example company: use 'main-company'
  // Otherwise: use company.id as fallback
  const companyIdForQuery = company.companyId 
    ? company.companyId 
    : (company.id === 'main-company' ? 'main-company' : company.id);
  
  // Fetch sales dynamically for this specific company
  const { data: salesData, refetch: refetchSales } = useQuery({
    queryKey: ["sales", companyIdForQuery],
    queryFn: () => salesAPI.getAll({ 
      page: 1, 
      limit: 10000, 
      companyId: companyIdForQuery
    }),
    enabled: true,
  });

  // Use dynamically fetched sales or fallback to company.sales
  const sales = salesData?.sales || company.sales;

  // Extract unique values from sales data for dynamic dropdowns
  const uniqueValues = {
    product_names: [...new Set(sales.map(s => s.product_name).filter(Boolean))].sort(),
    product_categories: [...new Set(sales.map(s => s.product_category).filter(Boolean))].sort(),
    customer_types: [...new Set(sales.map(s => s.customer_type).filter(Boolean))].sort(),
    genders: [...new Set(sales.map(s => s.gender).filter(Boolean))].sort(),
    branches: [...new Set(sales.map(s => s.branch).filter(Boolean))].sort(),
    cities: [...new Set(sales.map(s => s.city).filter(Boolean))].sort(),
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Auto-calculate total_price
    if (field === "unit_price" || field === "quantity") {
      const unitPrice = field === "unit_price" ? parseFloat(value) || 0 : formData.unit_price || 0;
      const quantity = field === "quantity" ? parseInt(value) || 0 : formData.quantity || 0;
      const subtotal = unitPrice * quantity;
      const tax = subtotal * 0.05; // 5% tax
      const total = subtotal + tax;
      setFormData((prev) => ({
        ...prev,
        tax: parseFloat(tax.toFixed(2)),
        total_price: parseFloat(total.toFixed(2)),
      }));
    }
  };

  const handleCreate = async () => {
    try {
      const saleData = {
        ...formData,
        companyId: companyIdForQuery
      };
      await salesAPI.create(saleData as any);
      toast.success("Sale created successfully");
      setIsCreating(false);
      resetForm();
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["sales", companyIdForQuery] });
      // Refetch sales for this company
      await refetchSales();
    } catch (error) {
      toast.error("Failed to create sale");
    }
  };

  const handleUpdate = async () => {
    if (!editingSale?._id) return;
    try {
      const updateData = {
        ...formData,
        companyId: companyIdForQuery
      };
      await salesAPI.update(editingSale._id, updateData);
      toast.success("Sale updated successfully");
      setEditingSale(null);
      resetForm();
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["sales", companyIdForQuery] });
      // Refetch sales for this company
      await refetchSales();
    } catch (error) {
      toast.error("Failed to update sale");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    try {
      await salesAPI.delete(id, companyIdForQuery);
      toast.success("Sale deleted successfully");
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["sales", companyIdForQuery] });
      // Refetch sales for this company
      await refetchSales();
    } catch (error) {
      toast.error("Failed to delete sale");
    }
  };

  const resetForm = () => {
    // Reset to empty values, not hardcoded defaults
    setFormData({
      branch: "",
      city: "",
      customer_type: "",
      gender: "",
      product_name: "",
      product_category: "",
      unit_price: 0,
      quantity: 0,
      tax: 0,
      total_price: 0,
      reward_points: 0,
    });
  };

  const startEdit = (sale: Sale) => {
    setEditingSale(sale);
    setIsCreating(false);
    setFormData({
      branch: sale.branch,
      city: sale.city,
      customer_type: sale.customer_type,
      gender: sale.gender,
      product_name: sale.product_name,
      product_category: sale.product_category,
      unit_price: sale.unit_price,
      quantity: sale.quantity,
      tax: sale.tax,
      total_price: sale.total_price,
      reward_points: sale.reward_points,
    });
  };

  return (
    <Card className="p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">CRUD Operations - {company.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingSale) && (
        <Card className="p-4 mb-6 bg-muted/50">
          <h4 className="font-semibold mb-4">
            {editingSale ? "Edit Sale" : "Create New Sale"}
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Product Name</Label>
              <Input
                list={`product-names-${company.id}`}
                value={formData.product_name || ""}
                onChange={(e) => handleInputChange("product_name", e.target.value)}
                placeholder="Enter product name"
              />
              {uniqueValues.product_names.length > 0 && (
                <datalist id={`product-names-${company.id}`}>
                  {uniqueValues.product_names.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              )}
            </div>
            <div>
              <Label>Product Category</Label>
              <Input
                list={`product-categories-${company.id}`}
                value={formData.product_category || ""}
                onChange={(e) => handleInputChange("product_category", e.target.value)}
                placeholder="Enter product category"
              />
              {uniqueValues.product_categories.length > 0 && (
                <datalist id={`product-categories-${company.id}`}>
                  {uniqueValues.product_categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              )}
            </div>
            <div>
              <Label>Customer Type</Label>
              <Input
                list={`customer-types-${company.id}`}
                value={formData.customer_type || ""}
                onChange={(e) => handleInputChange("customer_type", e.target.value)}
                placeholder="Enter customer type"
              />
              {uniqueValues.customer_types.length > 0 && (
                <datalist id={`customer-types-${company.id}`}>
                  {uniqueValues.customer_types.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              )}
            </div>
            <div>
              <Label>Gender</Label>
              <Input
                list={`genders-${company.id}`}
                value={formData.gender || ""}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                placeholder="Enter gender"
              />
              {uniqueValues.genders.length > 0 && (
                <datalist id={`genders-${company.id}`}>
                  {uniqueValues.genders.map((gender) => (
                    <option key={gender} value={gender} />
                  ))}
                </datalist>
              )}
            </div>
            <div>
              <Label>Branch</Label>
              <Input
                list={`branches-${company.id}`}
                value={formData.branch || ""}
                onChange={(e) => handleInputChange("branch", e.target.value)}
                placeholder="Enter branch"
              />
              {uniqueValues.branches.length > 0 && (
                <datalist id={`branches-${company.id}`}>
                  {uniqueValues.branches.map((branch) => (
                    <option key={branch} value={branch} />
                  ))}
                </datalist>
              )}
            </div>
            <div>
              <Label>City</Label>
              <Input
                list={`cities-${company.id}`}
                value={formData.city || ""}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Enter city"
              />
              {uniqueValues.cities.length > 0 && (
                <datalist id={`cities-${company.id}`}>
                  {uniqueValues.cities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              )}
            </div>
            <div>
              <Label>Unit Price</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => handleInputChange("unit_price", e.target.value)}
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
              />
            </div>
            <div>
              <Label>Tax</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.tax}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Total Price</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.total_price}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Reward Points</Label>
              <Input
                type="number"
                value={formData.reward_points}
                onChange={(e) => handleInputChange("reward_points", e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={editingSale ? handleUpdate : handleCreate}
              className="flex-1"
            >
              {editingSale ? "Update Sale" : "Create Sale"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingSale(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      {!isCreating && !editingSale && (
        <div className="mb-6">
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Sale
          </Button>
        </div>
      )}

      {/* Sales List */}
      <div className="space-y-2">
        <h4 className="font-semibold mb-4">Sales Records ({sales.length})</h4>
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {sales.length === 0 ? (
            <Card className="p-4 text-center text-muted-foreground">
              No sales records found for this company
            </Card>
          ) : (
            sales.map((sale) => (
            <Card key={sale._id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{sale.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.product_category} • Qty: {sale.quantity} • ${sale.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => startEdit(sale)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(sale._id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

