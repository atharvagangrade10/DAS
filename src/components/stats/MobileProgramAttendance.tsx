"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface SessionData {
  name: string;
  date: string;
  count: number;
}

interface ProgramAttendanceData {
  program_name: string;
  sessions: SessionData[];
}

interface MobileProgramAttendanceProps {
  data: ProgramAttendanceData[];
}

const MobileProgramAttendance: React.FC<MobileProgramAttendanceProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No program or session attendance data available yet.</p>;
  }

  return (
    <div className="space-y-6">
      {data.map((program) => (
        <Card key={program.program_name} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{program.program_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {program.sessions.length > 0 ? (
              program.sessions.map((session, index) => (
                <div key={`${program.program_name}-${session.name}-${session.date}`}>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{session.name}</span>
                    <span className="text-muted-foreground">{format(parseISO(session.date), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Attendees:</span>
                    <span className="font-semibold">{session.count}</span>
                  </div>
                  {index < program.sessions.length - 1 && <Separator className="my-2" />}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No sessions recorded for this program.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileProgramAttendance;