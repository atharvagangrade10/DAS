"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchYatras, fetchAttendedPrograms, fetchPaymentHistory } from "@/utils/api";
import { Yatra, PaymentRecord } from "@/types/yatra";
import { AttendedProgram } from "@/types/participant";
import YatraCard from "@/components/YatraCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";

const Index = () => {
  const { user } = useAuth();

  // Fetch Yatras
  const { data: yatras, isLoading: isLoadingYatras } = useQuery<Yatra[], Error>({
    queryKey: ["yatras"],
    queryFn: fetchYatras,
  });

  // Fetch Attended Programs for the logged-in user
  const { data: attendedPrograms, isLoading: isLoadingAttendance } = useQuery<AttendedProgram[], Error>({
    queryKey: ["attendedPrograms", user?.user_id],
    queryFn: () => fetchAttendedPrograms(user!.user_id),
    enabled: !!user?.user_id,
  });
  
  // Fetch Payment History for the logged-in user
  const { data: paymentHistory, isLoading: isLoadingPayments } = useQuery<PaymentRecord[], Error>({
    queryKey: ["paymentHistory", user?.user_id],
    queryFn: () => fetchPaymentHistory(user!.user_id),
    enabled: !!user?.user_id,
  });

  // Determine which Yatras the user has successfully paid for
  const registeredYatraIds = React.useMemo(() => {
    if (!paymentHistory) return new Set<string>();
    return new Set(
      paymentHistory
        .filter(p => p.status.toLowerCase() === 'success' || p.status.toLowerCase() === 'paid')
        .map(p => p.yatra_id)
    );
  }, [paymentHistory]);

  return (
    <div className="container mx-auto p-6 sm:p-8 space-y-12">
      <div className="text-left">
        <h1 className="text-4xl font-extrabold mb-2 text-gray-900 dark:text-white">
          Hare Krishna, {user?.full_name}!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Welcome to your spiritual dashboard.
        </p>
      </div>

      {/* Yatras Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Upcoming Yatras</h2>
        </div>
        
        {isLoadingYatras || isLoadingPayments ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : yatras && yatras.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {yatras.map((yatra) => (
              <YatraCard 
                key={yatra.id} 
                yatra={yatra} 
                isRegistered={registeredYatraIds.has(yatra.id)} // Pass registration status
              />
            ))}
          </div>
        ) : (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              No upcoming yatras scheduled at the moment.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Programs Attended Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-2">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Programs Attended</h2>
        </div>

        {isLoadingAttendance ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : attendedPrograms && attendedPrograms.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {attendedPrograms.map((program) => (
              <Card key={program.program_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{program.program_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(parseISO(program.start_date), "MMM yyyy")}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                      {program.sessions_attended.length} Sessions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {program.sessions_attended.slice(0, 5).map((session) => (
                      <Badge key={session.attendance_id} variant="outline" className="font-normal">
                        {session.session_name}
                      </Badge>
                    ))}
                    {program.sessions_attended.length > 5 && (
                      <span className="text-xs text-muted-foreground self-center">
                        +{program.sessions_attended.length - 5} more
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              You haven't attended any programs yet. Start your journey today!
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
};

export default Index;