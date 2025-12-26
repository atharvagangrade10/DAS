"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Yatra } from "@/types/yatra";
import { Badge } from "@/components/ui/badge";

interface YatraCardProps {
  yatra: Yatra;
}

const YatraCard: React.FC<YatraCardProps> = ({ yatra }) => {
  const feeEntries = Object.entries(yatra.registration_fees);

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-primary dark:text-primary-foreground">{yatra.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 grid gap-2">
        <p className="text-sm">
          <strong>Dates:</strong> {format(new Date(yatra.date_start), "PPP")} - {format(new Date(yatra.date_end), "PPP")}
        </p>
        
        <div className="mt-2">
          <h4 className="font-semibold text-sm mb-1">Registration Fees:</h4>
          <div className="flex flex-wrap gap-2">
            {feeEntries.length > 0 ? (
              feeEntries.map(([name, amount]) => (
                <Badge key={name} variant="secondary" className="text-sm">
                  {name}: ₹{amount}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No fees defined.</p>
            )}
          </div>
        </div>
        
        {/* Placeholder for future actions like managing attendees */}
        <div className="mt-4 flex justify-end">
          {/* <Button variant="outline" size="sm">Manage Attendees</Button> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default YatraCard;