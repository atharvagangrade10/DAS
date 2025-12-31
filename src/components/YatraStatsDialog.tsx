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
import { PieChart, Users, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface RegistrationOptionStats {
  option_name: string;
  adult_count: number;
  child_count: number;
  total_count: number;
}

export interface StatusStats {
  status: string;
  adult_count: number;
  child_count: number;
  total_count: number;
  options: RegistrationOptionStats[];
}

interface YatraStatsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  yatraName: string;
  totalAdults: number;
  totalChildren: number;
  totalCount: number;
  statsByStatus: StatusStats[];
}

const YatraStatsDialog: React.FC<YatraStatsDialogProps> = ({
  isOpen,
  onOpenChange,
  yatraName,
  totalAdults,
  totalChildren,
  totalCount,
  statsByStatus,
}) => {
  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "success" || s === "paid") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (s === "pending") return <Clock className="h-4 w-4 text-amber-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColorClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "success" || s === "paid") return "border-green-200 bg-green-50 dark:bg-green-950/20";
    if (s === "pending") return "border-amber-200 bg-amber-50 dark:bg-amber-950/20";
    return "border-red-200 bg-red-50 dark:bg-red-950/20";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Registration Stats: {yatraName}
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of participants and payments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-3 text-center shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </Card>
            <Card className="p-3 text-center shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Adults</p>
              <p className="text-2xl font-bold">{totalAdults}</p>
            </Card>
            <Card className="p-3 text-center shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Children</p>
              <p className="text-2xl font-bold">{totalChildren}</p>
            </Card>
          </div>

          <Separator />

          {/* Breakdown by Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Breakdown by Status
            </h3>
            
            {statsByStatus && statsByStatus.length > 0 ? (
              statsByStatus.map((statusGroup) => (
                <div key={statusGroup.status} className={`rounded-lg border p-4 ${getStatusColorClass(statusGroup.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(statusGroup.status)}
                      <span className="font-bold text-base">{statusGroup.status}</span>
                    </div>
                    <Badge variant="outline" className="bg-background font-bold">
                      {statusGroup.total_count} Participants
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="flex justify-between p-1 px-2 rounded bg-background/50">
                      <span className="text-muted-foreground">Adults:</span>
                      <span className="font-semibold">{statusGroup.adult_count}</span>
                    </div>
                    <div className="flex justify-between p-1 px-2 rounded bg-background/50">
                      <span className="text-muted-foreground">Children:</span>
                      <span className="font-semibold">{statusGroup.child_count}</span>
                    </div>
                  </div>

                  {/* Options within this status */}
                  <div className="space-y-2 pt-2 border-t border-dashed border-muted-foreground/20">
                    {statusGroup.options.map((option) => (
                      <div key={option.option_name} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground italic">{option.option_name}</span>
                        <span className="font-medium">{option.total_count} (A: {option.adult_count}, C: {option.child_count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">No status statistics available.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">Close Stats</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YatraStatsDialog;