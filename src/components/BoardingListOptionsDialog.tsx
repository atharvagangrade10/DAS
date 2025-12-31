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
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Layers } from "lucide-react";

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

export type HeaderField = "id" | "amount" | "date";

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
  onDownload: (selectedColumns: BoardingListColumn[], headerFields: HeaderField[]) => void;
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
  
  const [selectedHeaderFields, setSelectedHeaderFields] = React.useState<HeaderField[]>([
    "id", "amount", "date"
  ]);

  const toggleColumn = (columnId: BoardingListColumn) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const toggleHeaderField = (field: HeaderField) => {
    setSelectedHeaderFields((prev) =>
      prev.includes(field)
        ? prev.filter((id) => id !== field)
        : [...prev, field]
    );
  };

  const handleDownload = () => {
    onDownload(selectedColumns, selectedHeaderFields);
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
            Configure the boarding list for {yatraName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Table Columns</Label>
            <div className="grid grid-cols-2 gap-4">
              {COLUMN_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${option.id}`}
                    checked={selectedColumns.includes(option.id)}
                    onCheckedChange={() => toggleColumn(option.id)}
                  />
                  <Label
                    htmlFor={`col-${option.id}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transaction Header Info</Label>
            <p className="text-[10px] text-muted-foreground mb-2">Select which info appears in the gray header row above groups.</p>
            <div className="grid grid-cols-2 gap-4 border p-3 rounded-md bg-muted/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="h-id"
                  checked={selectedHeaderFields.includes("id")}
                  onCheckedChange={() => toggleHeaderField("id")}
                />
                <Label htmlFor="h-id" className="text-sm cursor-pointer">Transaction ID</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="h-amount"
                  checked={selectedHeaderFields.includes("amount")}
                  onCheckedChange={() => toggleHeaderField("amount")}
                />
                <Label htmlFor="h-amount" className="text-sm cursor-pointer">Total Amount</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="h-date"
                  checked={selectedHeaderFields.includes("date")}
                  onCheckedChange={() => toggleHeaderField("date")}
                />
                <Label htmlFor="h-date" className="text-sm cursor-pointer">Payment Date</Label>
              </div>
            </div>
            <p className="text-[10px] italic text-muted-foreground mt-1 text-center">
              (Uncheck all to hide the header rows completely)
            </p>
          </div>
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