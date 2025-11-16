export interface Company {
  _id: string;
  name: string;
  uploadedAt: string;
  isDefault: boolean;
  totalRecords: number;
  csvHeaders: string[];
}

export const uploadAPI = {
  // Upload CSV file
  uploadCSV: async (file: File, companyName?: string): Promise<{ company: Company }> => {
    const formData = new FormData();
    formData.append("csv", file);
    if (companyName) {
      formData.append("companyName", companyName);
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  },

  // Get all companies
  getCompanies: async (): Promise<Company[]> => {
    const response = await fetch("/api/upload/companies");
    if (!response.ok) throw new Error("Failed to fetch companies");
    return response.json();
  },

  // Delete company
  deleteCompany: async (companyId: string): Promise<void> => {
    const response = await fetch(`/api/upload/companies/${companyId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete company");
    }
  },
};

