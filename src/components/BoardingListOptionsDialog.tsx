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
  onDownload: (selectedColumns: BoardingListColumn[], includeGrouping: boolean) => void;
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
  const [includeGrouping, setIncludeGrouping] = React.useState(true);

  const toggleColumn = (columnId: BoardingListColumn) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleDownload = () => {
    onDownload(selectedColumns, includeGrouping);
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
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Columns</Label>
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
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grouping Options</Label>
            <div className="flex items-center space-x-2 p-3 rounded-md border bg-muted/30">
              <Checkbox
                id="grouping-toggle"
                checked={includeGrouping}
                onCheckedChange={(checked) => setIncludeGrouping(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="grouping-toggle"
                  className="text-sm font-bold leading-none cursor-pointer flex items-center gap-2"
                >
                  <Layers className="h-3 w-3" />
                  Show Transaction Headers
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Include gray header rows showing Payment ID, Amount, and Date.
                </p>
              </div>
            </div>
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