"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchYatras, fetchAttendedPrograms, fetchPaymentHistory, fetchParticipantById } from "@/utils/api";
import { Yatra, PaymentRecord } from "@/types/yatra";
import { AttendedProgram, Participant } from "@/types/participant";
import YatraCard from "@/components/YatraCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import CompleteProfileDialog from "@/components/CompleteProfileDialog";
import { AuthUser } from "@/types/auth";

// Helper function to map Participant to AuthUser structure
const participantToAuthUser = (p: Participant, currentRole: AuthUser['role']): AuthUser => ({
    user_id: p.id,
    full_name: p.full_name,
    initiated_name: p.initiated_name,
    phone: p.phone,
    address: p.address,
    place_name: p.place_name,
    age: p.age,
    dob: p.dob,
    gender: p.gender,
    email: p.email,
    profession: p.profession,
    devotee_friend_name: p.devotee_friend_name,
    chanting_rounds: p.chanting_rounds,
    role: currentRole,
    related_participant_ids: p.related_participant_ids,
    profile_photo_url: p.profile_photo_url,
});

const Index = () => {
  const { user, updateUser } = useAuth();
  const [isProfileIncomplete, setIsProfileIncomplete] = React.useState(false);

  const isManager = user?.role === 'Manager';

  // Fetch latest participant details
  const { data: latestParticipantData, isLoading: isLoadingParticipant } = useQuery<Participant, Error>({
    queryKey: ["latestParticipantDetails", user?.user_id],
    queryFn: () => fetchParticipantById(user!.user_id),
    enabled: !!user?.user_id,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Sync AuthContext user with latest fetched data if available
  React.useEffect(() => {
    if (latestParticipantData && user) {
      const dobChanged = latestParticipantData.dob !== user.dob;
      const addressChanged = latestParticipantData.address !== user.address;
      const emailChanged = latestParticipantData.email !== user.email;
      const photoChanged = latestParticipantData.profile_photo_url !== user.profile_photo_url;
      
      if (dobChanged || addressChanged || emailChanged || photoChanged) {
        const updatedUser = participantToAuthUser(latestParticipantData, user.role);
        updateUser(updatedUser);
      }
    }
  }, [latestParticipantData, user, updateUser]);

  // Check for mandatory fields
  React.useEffect(() => {
    if (latestParticipantData) {
      const p = latestParticipantData;
      const isIncomplete = 
        !p.full_name || 
        !p.phone || 
        !p.address || 
        !p.dob || 
        !p.gender || 
        !p.email ||
        !p.profile_photo_url;
      
      setIsProfileIncomplete(isIncomplete);
    } else if (!isLoadingParticipant && user) {
        setIsProfileIncomplete(true);
    }
  }, [latestParticipantData, isLoadingParticipant, user]);

  // Fetch Yatras
  const { data: yatras, isLoading: isLoadingYatras } = useQuery<Yatra[], Error>({
    queryKey: ["yatras"],
    queryFn: fetchYatras,
  });

  // Fetch Attended Programs
  const { data: attendedPrograms, isLoading: isLoadingAttendance } = useQuery<AttendedProgram[], Error>({
    queryKey: ["attendedPrograms", user?.user_id],
    queryFn: () => fetchAttendedPrograms(user!.user_id),
    enabled: !!user?.user_id,
  });
  
  // Fetch Payment History
  const { data: paymentHistory, isLoading: isLoadingPayments } = useQuery<PaymentRecord[], Error>({
    queryKey: ["paymentHistory", user?.user_id],
    queryFn: () => fetchPaymentHistory(user!.user_id),
    enabled: !!user?.user_id,
  });

  // Determine registered Yatras
  const registeredYatraIds = React.useMemo(() => {
    if (!paymentHistory) return new Set<string>();
    return new Set(
      paymentHistory
        .filter(p => p.status.toLowerCase() === 'success' || p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completed')
        .map(p => p.yatra_id)
    );
  }, [paymentHistory]);

  if (isLoadingParticipant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 sm:p-8 space-y-12">
      <div className="text-left">
        <h1 className="text-4xl font-extrabold mb-2 text-gray-900 dark:text-white">
          Hare Krishna, {latestParticipantData?.full_name || user?.full_name || "Devotee"}!
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
                isRegistered={registeredYatraIds.has(yatra.id)} 
                showAdminControls={isManager} // Enable admin buttons for managers
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

      <CompleteProfileDialog 
        isOpen={isProfileIncomplete} 
        onOpenChange={setIsProfileIncomplete} 
      />
    </div>
  );
};

export default Index;