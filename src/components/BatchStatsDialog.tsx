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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, CalendarDays, BarChart3, Percent, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBatchStats } from "@/utils/api";
import { Batch, BatchStatsResponse } from "@/types/batch";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ClassStats from "@/components/batch-management/ClassStats";

interface BatchStatsDialogProps {
  batch: Batch;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BatchStatsDialog: React.FC<BatchStatsDialogProps> = ({
  batch,
  isOpen,
  onOpenChange,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <BarChart3 className="h-6 w-6 text-primary" />
            Class Stats: {batch.name}
          </DialogTitle>
          <DialogDescription>
            Detailed attendance statistics for this class.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <ClassStats batchId={batch.id} />
          </ScrollArea>
        </div>
        <DialogFooter className="p-6 pt-3 border-t">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchStatsDialog;