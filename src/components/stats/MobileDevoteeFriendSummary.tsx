"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DevoteeFriendSummaryItem {
  devoteeFriendName: string;
  participantCount: number;
}

interface MobileDevoteeFriendSummaryProps {
  data: DevoteeFriendSummaryItem[];
}

const MobileDevoteeFriendSummary: React.FC<MobileDevoteeFriendSummaryProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No devotee friend summary data available.</p>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.devoteeFriendName} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{item.devoteeFriendName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-sm">
              <span>Participants Brought:</span>
              <span className="font-semibold">{item.participantCount}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileDevoteeFriendSummary;