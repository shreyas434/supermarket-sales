import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const CSVUpload = ({ onClose }: { onClose?: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        if (!companyName) {
          setCompanyName(selectedFile.name.replace(".csv", ""));
        }
      } else {
        toast.error("Please select a CSV file");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("csv", file);
    if (companyName) {
      formData.append("companyName", companyName);
    }

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      toast.success(`CSV uploaded successfully! ${result.company.totalRecords} records imported.`);
      
      // Reset form
      setFile(null);
      setCompanyName("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload CSV");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Upload CSV File</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="company-name">Company Name (Optional)</Label>
          <Input
            id="company-name"
            placeholder="Enter company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            If not provided, will use filename or default name
          </p>
        </div>

        <div>
          <Label htmlFor="csv-file">CSV File</Label>
          <div className="mt-2">
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          {file && (
            <div className="mt-3 p-3 bg-muted rounded-lg flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Supported CSV Formats:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Any CSV format with headers</li>
            <li>Auto-detects common field names (product, price, quantity, etc.)</li>
            <li>Missing fields will use default values</li>
            <li>Auto-calculates totals if not provided</li>
          </ul>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload CSV"}
        </Button>
      </div>
    </Card>
  );
};

