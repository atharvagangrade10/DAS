"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HistoryTabContentProps {
  onOpenHistoryDialog: () => void;
}

const HistoryTabContent: React.FC<HistoryTabContentProps> = ({ onOpenHistoryDialog }) => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  const isVolunteer = user?.role === 'Volunteer';
  const isStaff = isManager || isVolunteer;

  return (
    <div className="text-center py-12">
      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Attendance History</h3>
      <p className="text-muted-foreground mb-6">
        View {isStaff ? "detailed" : "your"} attendance records for this class over time.
      </p>
      <Button onClick={onOpenHistoryDialog}>
        {isStaff ? "View Full History" : "View My History"}
      </Button>
    </div>
  );
};

export default HistoryTabContent;