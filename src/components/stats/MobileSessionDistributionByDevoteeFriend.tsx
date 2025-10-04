"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface DistributionItem {
  numSessions: number;
  count: number;
}

interface DevoteeFriendDistributionData {
  devoteeFriendName: string;
  distribution: DistributionItem[];
}

interface MobileSessionDistributionByDevoteeFriendProps {
  data: DevoteeFriendDistributionData[];
}

const MobileSessionDistributionByDevoteeFriend: React.FC<MobileSessionDistributionByDevoteeFriendProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No devotee friend session attendance distribution data available.</p>;
  }

  return (
    <div className="space-y-6">
      {data.map((df) => (
        <Card key={df.devoteeFriendName} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{df.devoteeFriendName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {df.distribution.length > 0 ? (
              df.distribution.map((item, index) => (
                <div key={`${df.devoteeFriendName}-${item.numSessions}`}>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.numSessions} total session{item.numSessions !== 1 ? "s" : ""} attended</span>
                    <span className="font-semibold">{item.count} participant{item.count !== 1 ? "s" : ""}</span>
                  </div>
                  {index < df.distribution.length - 1 && <Separator className="my-2" />}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No session attendance distribution for this devotee friend.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileSessionDistributionByDevoteeFriend;