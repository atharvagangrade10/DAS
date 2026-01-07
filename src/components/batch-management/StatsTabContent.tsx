"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Percent, CalendarDays, CheckCircle2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Batch, BatchParticipantStats } from "@/types/batch";
import { fetchBatchParticipantStats } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsTabContentProps {
    batch: Batch;
    participantId?: string;
}

const StatsTabContent: React.FC<StatsTabContentProps> = ({ batch, participantId }) => {
    const { user } = useAuth();
    const targetParticipantId = participantId || user?.user_id;

    const { data: stats, isLoading, error } = useQuery<BatchParticipantStats, Error>({
        queryKey: ["batchParticipantStats", batch.id, targetParticipantId],
        queryFn: () => fetchBatchParticipantStats(batch.id, targetParticipantId!),
        enabled: !!batch.id && !!targetParticipantId,
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-destructive bg-destructive/10 rounded-lg">
                <p>Error loading statistics: {error.message}</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No statistics available yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Attendance Summary for {stats.full_name}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold text-primary">{stats.attendance_percentage}%</p>
                            <p className="text-xs text-muted-foreground mt-1">Overall Attendance</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-semibold">{stats.attendance_ratio}</p>
                            <p className="text-xs text-muted-foreground mt-1">Sessions Attended</p>
                        </div>
                    </div>
                    <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary"
                            style={{ width: `${stats.attendance_percentage}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-medium">Attended</CardTitle>
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.attended_count}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 border-t pt-1">Successful sessions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-medium">Total</CardTitle>
                        <CalendarDays className="h-3 w-3 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_sessions}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 border-t pt-1">Conducted sessions</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StatsTabContent;
