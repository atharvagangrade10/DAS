"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

interface HistoryTabContentProps {
  onOpenHistoryDialog: () => void;
}

const HistoryTabContent: React.FC<HistoryTabContentProps> = ({ onOpenHistoryDialog }) => {
  return (
    <div className="text-center py-12">
      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Attendance History</h3>
      <p className="text-muted-foreground mb-6">
        View detailed attendance records for this class over time.
      </p>
      <Button onClick={onOpenHistoryDialog}>
        View Full History
      </Button>
    </div>
  );
};

export default HistoryTabContent;