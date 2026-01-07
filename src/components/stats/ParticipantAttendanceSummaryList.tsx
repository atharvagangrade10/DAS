"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Participant } from "@/types/participant";
import { cn } from "@/lib/utils";
import DownloadShareButton from "./DownloadShareButton"; // Assuming this is for the overall card

interface ParticipantAttendanceSummary {
  participant: Participant;
  attendedSessions: number;
  possibleSessions: number;
  attendancePercentage: number;
}

interface ParticipantAttendanceSummaryListProps {
  data: ParticipantAttendanceSummary[];
  isLoading: boolean;
  cardId: string;
  cardTitle: string;
}

const ParticipantAttendanceSummaryList: React.FC<ParticipantAttendanceSummaryListProps> = ({
  data,
  isLoading,
  cardId,
  cardTitle,
}) => {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No participant attendance summary data available.
      </p>
    );
  }

  const renderMobileCard = (item: ParticipantAttendanceSummary) => (
    <Card key={item.participant.id} className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          {item.participant.full_name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{item.participant.phone}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span>Sessions Attended:</span>
          <span className="font-semibold">
            {item.attendedSessions} / {item.possibleSessions}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span>Attendance Rate:</span>
          <Badge
            variant={
              item.attendancePercentage >= 75
                ? "default"
                : item.attendancePercentage >= 50
                ? "secondary"
                : "destructive"
            }
            className={cn(
              item.attendancePercentage >= 75
                ? "bg-green-600 hover:bg-green-600"
                : item.attendancePercentage >= 50
                ? "bg-yellow-600 hover:bg-yellow-600"
                : "bg-red-600 hover:bg-red-600",
              "text-white"
            )}
          >
            {item.attendancePercentage}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderDesktopTable = () => (
    <ScrollArea className="h-96 pr-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Participant Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-center">Attended</TableHead>
            <TableHead className="text-center">Possible</TableHead>
            <TableHead className="text-right">Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.participant.id}>
              <TableCell className="font-medium">{item.participant.full_name}</TableCell>
              <TableCell>{item.participant.phone}</TableCell>
              <TableCell className="text-center">{item.attendedSessions}</TableCell>
              <TableCell className="text-center">{item.possibleSessions}</TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={
                    item.attendancePercentage >= 75
                      ? "default"
                      : item.attendancePercentage >= 50
                      ? "secondary"
                      : "destructive"
                  }
                  className={cn(
                    item.attendancePercentage >= 75
                      ? "bg-green-600 hover:bg-green-600"
                      : item.attendancePercentage >= 50
                      ? "bg-yellow-600 hover:bg-yellow-600"
                      : "bg-red-600 hover:bg-red-600",
                    "text-white"
                  )}
                >
                  {item.attendancePercentage}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      {isMobile ? (
        <div className="space-y-4">{data.map(renderMobileCard)}</div>
      ) : (
        renderDesktopTable()
      )}
      <DownloadShareButton cardId={cardId} cardTitle={cardTitle} />
    </div>
  );
};

export default ParticipantAttendanceSummaryList;