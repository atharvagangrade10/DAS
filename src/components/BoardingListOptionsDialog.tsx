"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, Download } from "lucide-react";

export type BoardingListColumn = 
  | "index" 
  | "full_name" 
  | "initiated_name" 
  | "phone" 
  | "gender" 
  | "age" 
  | "type" 
  | "option" 
  | "amount"
  | "address" 
  | "profession" 
  | "verify";

interface ColumnOption {
  id: BoardingListColumn;
  label: string;
}

const COLUMN_OPTIONS: ColumnOption[] = [
  { id: "index", label: "# (Serial)" },
  { id: "full_name", label: "Full Name" },
  { id: "initiated_name", label: "Initiated Name" },
  { id: "phone", label: "Phone Number" },
  { id: "gender", label: "Gender" },
  { id: "age", label: "Age" },
  { id: "type", label: "Type (Adult/Child)" },
  { id: "option", label: "Registration Plan" },
  { id: "amount", label: "Amount Paid" },
  { id: "address", label: "Address" },
  { id: "profession", label: "Profession" },
  { id: "verify", label: "Verify (Checkbox)" },
];

interface BoardingListOptionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (selectedColumns: BoardingListColumn[]) => void;
  yatraName: string;
}

const BoardingListOptionsDialog: React.FC<BoardingListOptionsDialogProps> = ({
  isOpen,
  onOpenChange,
  onDownload,
  yatraName,
}) => {
  const [selectedColumns, setSelectedColumns] = React.useState<BoardingListColumn[]>([
    "index", "full_name", "phone", "type", "option", "verify"
  ]);

  const toggleColumn = (columnId: BoardingListColumn) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleDownload = () => {
    onDownload(selectedColumns);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            PDF Export Options
          </DialogTitle>
          <DialogDescription>
            Select columns for {yatraName}'s boarding list.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {COLUMN_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`col-${option.id}`}
                checked={selectedColumns.includes(option.id)}
                onCheckedChange={() => toggleColumn(option.id)}
              />
              <Label
                htmlFor={`col-${option.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleDownload} disabled={selectedColumns.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoardingListOptionsDialog;