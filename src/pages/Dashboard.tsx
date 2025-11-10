import { useState } from "react";
import Papa from "papaparse";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { SalesMetrics } from "@/components/dashboard/SalesMetrics";
import { PredictiveAnalytics } from "@/components/dashboard/PredictiveAnalytics";
import { GenericDataTable } from "@/components/dashboard/GenericDataTable";
import { GenericAnalytics } from "@/components/dashboard/GenericAnalytics";

export interface SalesData {
  "Invoice ID": string;
  Date: string;
  "Product line": string;
  Quantity: string;
  Total: string;
  Payment: string;
  City: string;
  "Customer Type": string;
}

const Dashboard = () => {
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if data matches the sales data structure
  const isSalesData = columns.includes("Total") && 
                       columns.includes("Date") && 
                       columns.includes("Product line");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        const filteredData = data.filter(row => Object.values(row).some(val => val));
        
        if (filteredData.length > 0) {
          const cols = Object.keys(filteredData[0]);
          setColumns(cols);
          setCsvData(filteredData);
        }
        setIsLoading(false);
      },
      error: () => {
        setIsLoading(false);
      },
    });
  };

  const downloadSampleCSV = () => {
    const sampleData = `Invoice ID,Date,Product line,Quantity,Total,Payment,City,Customer Type
INV001,2024-01-15,Food and beverages,5,125.50,Cash,New York,Member
INV002,2024-01-15,Fashion accessories,2,89.99,Credit card,Los Angeles,Normal
INV003,2024-01-16,Electronic accessories,3,245.75,E-wallet,Chicago,Member
INV004,2024-01-16,Home and lifestyle,1,156.20,Cash,Houston,Normal
INV005,2024-01-17,Health and beauty,4,198.40,Credit card,Phoenix,Member
INV006,2024-01-17,Sports and travel,2,175.80,Cash,Philadelphia,Normal
INV007,2024-01-18,Food and beverages,6,142.30,E-wallet,San Antonio,Member
INV008,2024-01-18,Fashion accessories,3,267.90,Credit card,San Diego,Normal
INV009,2024-01-19,Electronic accessories,1,320.50,Cash,Dallas,Member
INV010,2024-01-19,Home and lifestyle,2,189.75,E-wallet,San Jose,Normal
INV011,2024-01-20,Health and beauty,5,234.60,Credit card,Austin,Member
INV012,2024-01-20,Sports and travel,3,298.40,Cash,Jacksonville,Normal
INV013,2024-01-21,Food and beverages,4,167.20,E-wallet,Fort Worth,Member
INV014,2024-01-21,Fashion accessories,2,145.80,Credit card,Columbus,Normal
INV015,2024-01-22,Electronic accessories,1,289.99,Cash,Charlotte,Member
INV016,2024-01-22,Home and lifestyle,3,212.35,E-wallet,San Francisco,Normal
INV017,2024-01-23,Health and beauty,2,178.90,Credit card,Indianapolis,Member
INV018,2024-01-23,Sports and travel,4,321.50,Cash,Seattle,Normal
INV019,2024-01-24,Food and beverages,3,134.75,E-wallet,Denver,Member
INV020,2024-01-24,Fashion accessories,1,98.60,Credit card,Washington,Normal
INV021,2024-01-25,Electronic accessories,2,267.40,Cash,Boston,Member
INV022,2024-01-25,Home and lifestyle,4,245.80,E-wallet,El Paso,Normal
INV023,2024-01-26,Health and beauty,3,189.50,Credit card,Detroit,Member
INV024,2024-01-26,Sports and travel,2,215.70,Cash,Nashville,Normal
INV025,2024-01-27,Food and beverages,5,156.90,E-wallet,Portland,Member
INV026,2024-01-27,Fashion accessories,3,278.30,Credit card,Oklahoma City,Normal
INV027,2024-01-28,Electronic accessories,1,345.60,Cash,Las Vegas,Member
INV028,2024-01-28,Home and lifestyle,2,198.45,E-wallet,Louisville,Normal
INV029,2024-01-29,Health and beauty,4,223.80,Credit card,Baltimore,Member
INV030,2024-01-29,Sports and travel,3,289.90,Cash,Milwaukee,Normal`;

    const blob = new Blob([sampleData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "supermarket_sales_sample.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="mb-2 text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Sales Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Upload your sales data to view insights and trends
          </p>
        </div>

        {csvData.length === 0 ? (
          <Card className="border-2 border-dashed p-12 text-center animate-scale-in">
            <div className="mx-auto max-w-md space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-semibold">Upload CSV Data</h2>
                <p className="text-muted-foreground">
                  Upload any CSV file to view analytics and insights
                </p>
              </div>
              <div className="space-y-4">
                <Button asChild className="w-full" size="lg">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mr-2 h-5 w-5" />
                    Choose CSV File
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadSampleCSV}
                  className="w-full"
                >
                  Download Sample CSV
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Analysis Results</h2>
              <Button asChild variant="outline">
                <label htmlFor="file-upload-new" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New File
                  <input
                    id="file-upload-new"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>

            {isSalesData ? (
              <>
                <SalesMetrics data={csvData as unknown as SalesData[]} />

                <div className="grid gap-6 md:grid-cols-2">
                  <SalesChart data={csvData as unknown as SalesData[]} />
                  <CategoryChart data={csvData as unknown as SalesData[]} />
                </div>

                <TopProducts data={csvData as unknown as SalesData[]} />

                <div className="mt-8">
                  <h2 className="text-2xl font-semibold mb-4">Predictive Analytics</h2>
                  <PredictiveAnalytics data={csvData as unknown as SalesData[]} />
                </div>
              </>
            ) : (
              <>
                <GenericAnalytics data={csvData} columns={columns} />
                <GenericDataTable data={csvData} columns={columns} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
