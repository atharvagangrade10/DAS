"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, CalendarDays, BarChart3, Percent, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBatchStats } from "@/utils/api";
import { Batch, BatchStatsResponse } from "@/types/batch";
import { cn } from "@/lib/utils";

interface ClassStatsProps {
    batchId: string;
}

const ClassStats: React.FC<ClassStatsProps> = ({ batchId }) => {
    // Fetch batch statistics
    const { data: batchStatsData, isLoading, error } = useQuery<BatchStatsResponse, Error>({
        queryKey: ["batchStats", batchId],
        queryFn: () => fetchBatchStats(batchId),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12 gap-2">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-muted-foreground">Loading attendance data...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Error: {error.message}</div>;
    }

    if (!batchStatsData) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No statistics available for this class yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overall Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold">{batchStatsData.stats.length}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Number of participants in this class.
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold">
                            {batchStatsData.stats.length > 0 ? batchStatsData.stats[0].total_sessions : 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Total sessions for each participant.
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold">
                            {batchStatsData.stats.length > 0
                                ? Math.round(batchStatsData.stats.reduce((acc, curr) => acc + curr.attendance_percentage, 0) / batchStatsData.stats.length)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Average attendance percentage across all participants.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Participant Statistics */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Participant Statistics
                </h3>
                <ScrollArea className="h-[300px] border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Participant Name</TableHead>
                                <TableHead className="text-center">Attended</TableHead>
                                <TableHead className="text-center">Total</TableHead>
                                <TableHead className="text-right">Percentage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batchStatsData.stats.map((stat) => (
                                <TableRow key={stat.participant_id}>
                                    <TableCell className="font-medium">{stat.full_name}</TableCell>
                                    <TableCell className="text-center">{stat.attended_count}</TableCell>
                                    <TableCell className="text-center">{stat.total_sessions}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            variant={
                                                stat.attendance_percentage >= 75
                                                    ? "default"
                                                    : stat.attendance_percentage >= 50
                                                        ? "secondary"
                                                        : "destructive"
                                            }
                                            className={cn(
                                                stat.attendance_percentage >= 75
                                                    ? "bg-green-600 hover:bg-green-600"
                                                    : stat.attendance_percentage >= 50
                                                        ? "bg-yellow-600 hover:bg-yellow-600"
                                                        : "bg-red-600 hover:bg-red-600",
                                                "text-white"
                                            )}
                                        >
                                            {stat.attendance_percentage}%
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
};

export default ClassStats;
