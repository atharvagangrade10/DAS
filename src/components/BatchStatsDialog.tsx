"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

interface BatchStatsDialogProps {
  batch: Batch;
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

const BatchStatsDialog: React.FC<BatchStatsDialogProps> = ({
  batch,
  isOpen,
  onOpenChange,
}) => {
  const isMobile = useIsMobile();

  // Fetch participants for this batch
  const { data: currentMappings, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["batchParticipants", batch.id],
    queryFn: () => fetchBatchAttendance(batch.id, format(new Date(), "yyyy-MM-dd")),
    enabled: isOpen,
  });

  // Fetch detailed participant profiles
  const { data: participants, isLoading: isLoadingParticipants } = useQuery<Participant[]>({
    queryKey: ["batchParticipantDetailsForStats", batch.id, currentMappings?.length],
    queryFn: async () => {
      if (!currentMappings) return [];
      const promises = currentMappings.map((m: any) =>
        fetchParticipantById(m.participant_id)
      );
      return Promise.all(promises);
    },
    enabled: !!currentMappings,
  });

  // Calculate total possible sessions based on recurrence
  const totalPossibleSessions = React.useMemo(() => {
    if (!batch.start_date) return 0;

    let count = 0;
    let currentDate = new Date(batch.start_date);
    const today = new Date();

    while (currentDate <= today) {
      if (batch.recursion_type === "Daily") {
        count++;
      } else if (batch.recursion_type === "Weekly") {
        const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
        // Adjust to match 0 for Monday, 6 for Sunday if batch.days_of_week uses that
        const adjustedDayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        if (batch.days_of_week.includes(adjustedDayOfWeek)) {
          count++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
  }, [batch.start_date, batch.recursion_type, batch.days_of_week]);

  // Calculate statistics from attendance data
  const batchStats = React.useMemo(() => {
    if (!participants || participants.length === 0) return [] as BatchAttendanceSummary[];

    return [{
      batch_id: batch.id,
      batch_name: batch.name,
      total_sessions: totalPossibleSessions,
      attended_sessions: 0, // Placeholder - would need actual attendance data
      attendance_percentage: 0, // Placeholder
    }];
  }, [participants, batch, totalPossibleSessions]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <BarChart3 className="h-6 w-6 text-primary" />
            Class Stats: {batch.name}
          </DialogTitle>
          <DialogDescription>
            Overview of participants and theoretical session count.
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

                {isLoadingParticipants ? (
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
                      No participants have attended any classes yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Participants List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Participants
                </h3>
                {isLoadingParticipants ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">Loading participants...</span>
                  </div>
                ) : participants && participants.length > 0 ? (
                  <div className="grid gap-2">
                    {participants.map((p) => (
                      <Card key={p.id} className="p-3 flex items-center gap-3 shadow-sm">
                        <Avatar className="h-9 w-9 border">
                          {p.profile_photo_url ? (
                            <AvatarImage src={p.profile_photo_url} alt={p.full_name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {p.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground">{p.phone}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No participants registered for this class yet.</p>
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
                        Summary for {batch.name}
                      </h4>
                      <Badge variant="outline" className="bg-background">
                        {batch.recursion_type}
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
        <DialogFooter className="p-6 pt-3 border-t">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchStatsDialog;