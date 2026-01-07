"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { User, CalendarDays, CheckCircle2, XCircle, BarChart3, Percent, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBatchAttendance, fetchParticipantById } from "@/utils/api";
import { Participant } from "@/types/participant";
import { Batch } from "@/types/batch";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ParticipantStatsDialogProps {
  participant: Participant | null;
  batches: Batch[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AttendanceRecord {
  batch_id: string;
  date: string;
  status: string;
  marked_by?: string;
}

interface BatchAttendanceSummary {
  batch_id: string;
  batch_name: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
  last_attended?: string;
}

const ParticipantStatsDialog: React.FC<ParticipantStatsDialogProps> = ({
  participant,
  batches,
  isOpen,
  onOpenChange,
}) => {
  const isMobile = useIsMobile();

  // Close dialog if participant is null
  React.useEffect(() => {
    if (!participant && isOpen) {
      onOpenChange(false);
    }
  }, [participant, isOpen, onOpenChange]);

  // Fetch attendance data for all batches this participant is in
  const { data: attendanceData, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["participantBatchAttendanceStats", participant?.id],
    queryFn: async () => {
      if (!participant?.id) return [];
      // In a real implementation, we would fetch attendance data for this participant
      // across all batches they're enrolled in
      // For now, we'll return mock data
      return [] as any[];
    },
    enabled: isOpen && !!participant?.id,
  });

  // Calculate statistics from attendance data
  const batchStats = React.useMemo(() => {
    if (!attendanceData || !batches || !participant) return [] as BatchAttendanceSummary[];

    // Group attendance by batch
    const statsByBatch: Record<string, BatchAttendanceSummary> = {};

    // Initialize all batches the participant is in
    batches.forEach(batch => {
      if (!batch.id) return;
      statsByBatch[batch.id] = {
        batch_id: batch.id,
        batch_name: batch.name,
        total_sessions: 0,
        attended_sessions: 0,
        attendance_percentage: 0,
      };
    });

    // Process attendance data
    attendanceData.forEach(record => {
      if (!record.batch_id || !statsByBatch[record.batch_id]) return;

      const stat = statsByBatch[record.batch_id];
      stat.total_sessions++;

      if (record.status === "Present") {
        stat.attended_sessions++;
      }

      // Update last attended date if this record is more recent
      if (record.date && (!stat.last_attended || record.date > stat.last_attended)) {
        stat.last_attended = record.date;
      }
    });

    // Calculate percentages
    Object.values(statsByBatch).forEach(stat => {
      stat.attendance_percentage = stat.total_sessions > 0
        ? Math.round((stat.attended_sessions / stat.total_sessions) * 100)
        : 0;
    });

    return Object.values(statsByBatch);
  }, [attendanceData, batches, participant]);

  // Calculate overall statistics
  const overallStats = React.useMemo(() => {
    if (batchStats.length === 0) {
      return {
        total_classes: 0,
        total_sessions: 0,
        total_attended: 0,
        overall_percentage: 0,
      };
    }

    const total_classes = batchStats.length;
    const total_sessions = batchStats.reduce((sum, stat) => sum + stat.total_sessions, 0);
    const total_attended = batchStats.reduce((sum, stat) => sum + stat.attended_sessions, 0);
    const overall_percentage = total_sessions > 0
      ? Math.round((total_attended / total_sessions) * 100)
      : 0;

    return {
      total_classes,
      total_sessions,
      total_attended,
      overall_percentage,
    };
  }, [batchStats]);

  // Don't render if participant is null
  if (!participant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <User className="h-6 w-6 text-primary" />
            {participant.full_name}'s Attendance Stats
          </DialogTitle>
          <DialogDescription>
            Detailed attendance records across all spiritual classes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6 py-4">
              {/* Overall Statistics Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{overallStats.overall_percentage}%</div>
                    <Progress value={overallStats.overall_percentage} className="mt-2 h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {overallStats.total_attended} of {overallStats.total_sessions} sessions attended
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Classes Enrolled</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{overallStats.total_classes}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Participating in {overallStats.total_classes} spiritual {overallStats.total_classes === 1 ? 'class' : 'classes'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Batch Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Class-by-Class Breakdown
                </h3>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12 gap-2">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">Loading attendance data...</span>
                  </div>
                ) : batchStats.length > 0 ? (
                  <ScrollArea className="h-[300px] border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Class Name</TableHead>
                          <TableHead className="text-center">Sessions</TableHead>
                          <TableHead className="text-center">Attended</TableHead>
                          <TableHead className="text-center">Percentage</TableHead>
                          <TableHead className="text-right">Last Attended</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchStats.map((stat) => (
                          <TableRow key={stat.batch_id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                {stat.batch_name}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{stat.total_sessions}</TableCell>
                            <TableCell className="text-center font-semibold text-green-600">
                              {stat.attended_sessions}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={stat.attendance_percentage >= 75 ? "default" :
                                         stat.attendance_percentage >= 50 ? "secondary" : "destructive"}
                                className={cn(
                                  stat.attendance_percentage >= 75 ? "bg-green-600 hover:bg-green-600" :
                                  stat.attendance_percentage >= 50 ? "bg-yellow-600 hover:bg-yellow-600" :
                                  "bg-red-600 hover:bg-red-600",
                                  "text-white"
                                )}
                              >
                                {stat.attendance_percentage}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {stat.last_attended ? (
                                <div className="flex items-center justify-end gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  {format(parseISO(stat.last_attended), "MMM dd, yyyy")}
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  Never
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                    <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No attendance records found.</p>
                    <p className="text-xs mt-1">
                      {participant.full_name} hasn't attended any classes yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Summary Section */}
              <div className="border-t pt-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Summary for {participant.full_name}
                      </h4>
                      <Badge variant="outline" className="bg-background">
                        {participant.role}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Classes</p>
                        <p className="text-2xl font-bold mt-1">{overallStats.total_classes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sessions</p>
                        <p className="text-2xl font-bold mt-1">{overallStats.total_sessions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Attendance Rate</p>
                        <p className="text-2xl font-bold mt-1 text-green-600">{overallStats.overall_percentage}%</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <p className="text-xs text-muted-foreground text-center">
                        Spiritual progress through regular attendance and participation
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantStatsDialog;