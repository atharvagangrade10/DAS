"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, IndianRupee } from "lucide-react";
import { Yatra } from "@/types/yatra";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface YatraCardProps {
  yatra: Yatra;
}

const YatraCard: React.FC<YatraCardProps> = ({ yatra }) => {
  // Filter out zero fees and map keys for display (now using dynamic keys)
  const feeEntries = Object.entries(yatra.registration_fees)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => {
      // Assuming the key is the user-defined category name
      return { key, value };
    });

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-semibold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          {yatra.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 grid gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <p>
            {format(new Date(yatra.date_start), "PPP")} - {format(new Date(yatra.date_end), "PPP")}
          </p>
        </div>
        
        <div className="space-y-2 pt-2 border-t">
          <h4 className="font-medium flex items-center gap-1 text-base">
            <IndianRupee className="h-4 w-4" /> Registration Fees:
          </h4>
          {feeEntries.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {feeEntries.map((fee) => (
                <Badge key={fee.key} variant="secondary" className="text-sm px-3 py-1">
                  {fee.key}: ₹{fee.value}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No fees specified.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default YatraCard;