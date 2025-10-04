"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import DownloadShareButton from "./DownloadShareButton"; // Import the new button

interface SessionData {
  name: string;
  date: string;
  count: number;
}

interface ProgramData {
  program_name: string;
  sessions: SessionData[];
}

interface DevoteeFriendAttendanceData {
  devoteeFriendName: string;
  programs: ProgramData[];
}

interface MobileDevoteeFriendAttendanceProps {
  data: DevoteeFriendAttendanceData[];
}

const MobileDevoteeFriendAttendance: React.FC<MobileDevoteeFriendAttendanceProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No devotee friend attendance data available yet.</p>;
  }

  return (
    <div className="space-y-6">
      {data.map((df) => {
        const cardId = `df-attendance-${df.devoteeFriendName.replace(/\s+/g, '-').toLowerCase()}`;
        return (
          <Card key={df.devoteeFriendName} className="shadow-sm" id={cardId}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">{df.devoteeFriendName}</CardTitle>
              <DownloadShareButton cardId={cardId} cardTitle={`${df.devoteeFriendName} Attendance`} iconOnly={true} />
            </CardHeader>
            <CardContent className="space-y-4">
              {df.programs.length > 0 ? (
                <Accordion
                  type="multiple"
                  className="w-full"
                  defaultValue={df.programs.map(program => program.program_name)} // Keep all programs expanded by default
                >
                  {df.programs.map((program) => (
                    <AccordionItem key={`${df.devoteeFriendName}-${program.program_name}`} value={program.program_name}>
                      <AccordionTrigger className="text-base font-medium">{program.program_name}</AccordionTrigger>
                      <AccordionContent className="pt-2 pb-0">
                        <div className="space-y-3 pl-4">
                          {program.sessions.length > 0 ? (
                            program.sessions.map((session, index) => (
                              <div key={`${df.devoteeFriendName}-${program.program_name}-${session.name}-${session.date}`}>
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
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">No program attendance recorded for this devotee friend.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MobileDevoteeFriendAttendance;