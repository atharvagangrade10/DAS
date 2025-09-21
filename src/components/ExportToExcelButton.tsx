"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ExportToExcelButtonProps {
  data: any[];
  fileName: string;
  sheetName?: string;
}

const ExportToExcelButton: React.FC<ExportToExcelButtonProps> = ({
  data,
  fileName,
  sheetName = "Sheet1",
}) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.info("No data to export.", {
        description: "The current list of participants is empty.",
      });
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      toast.success("Data exported successfully!", {
        description: `"${fileName}.xlsx" has been downloaded.`,
      });
    } catch (error) {
      console.error("Failed to export to Excel:", error);
      toast.error("Failed to export data", {
        description: "An error occurred while creating the Excel file.",
      });
    }
  };

  return (
    <Button onClick={handleExport} className="flex items-center gap-2">
      <FileDown className="h-5 w-5" />
      Export to Excel
    </Button>
  );
};

export default ExportToExcelButton;