"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface DistributionItem {
  numSessions: number;
  count: number;
}

interface ProgramDistributionData {
  programId: string;
  programName: string;
  distribution: DistributionItem[];
}

interface MobileSessionDistributionByProgramProps {
  data: ProgramDistributionData[];
}

const MobileSessionDistributionByProgram: React.FC<MobileSessionDistributionByProgramProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No overall session attendance distribution data available.</p>;
  }

  return (
    <div className="space-y-6">
      {data.map((programData) => (
        <Card key={programData.programId} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{programData.programName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {programData.distribution.length > 0 ? (
              programData.distribution.map((item, index) => (
                <div key={`${programData.programId}-${item.numSessions}`}>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.numSessions} session{item.numSessions !== 1 ? "s" : ""} attended</span>
                    <span className="font-semibold">{item.count} participant{item.count !== 1 ? "s" : ""}</span>
                  </div>
                  {index < programData.distribution.length - 1 && <Separator className="my-2" />}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No distribution data for this program.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileSessionDistributionByProgram;