import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GenericDataTableProps {
  data: Record<string, string>[];
  columns: string[];
}

export const GenericDataTable = ({ data, columns }: GenericDataTableProps) => {
  const displayData = data.slice(0, 100); // Show first 100 rows

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Data Preview ({data.length} rows)</h3>
      <ScrollArea className="h-[500px] w-full">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="font-semibold">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column}>{row[column] || "-"}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      {data.length > 100 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Showing first 100 rows of {data.length}
        </p>
      )}
    </Card>
  );
};
