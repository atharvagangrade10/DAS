"use client";

import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Program } from "@/types/program";
import { Batch } from "@/types/batch";
import CreateProgramDialog from "@/components/CreateProgramDialog";
import CreateBatchDialog from "@/components/CreateBatchDialog";
import ProgramCard from "@/components/ProgramCard";
import BatchCard from "@/components/BatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPrograms, fetchBatches, fetchMyAssignedBatches, fetchMyEnrolledBatches } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Programs = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  const isVolunteer = user?.role === 'Volunteer';
  const isAttendee = user?.role === 'Attendee';

  const [isCreateProgramDialogOpen, setIsCreateProgramDialogOpen] = React.useState(false);
  const [isCreateBatchDialogOpen, setIsCreateBatchDialogOpen] = React.useState(false);

  const { data: programs, isLoading: isLoadingPrograms, error: programsError } = useQuery<Program[], Error>({
    queryKey: ["programs"],
    queryFn: fetchPrograms,
    enabled: isManager, // Only managers see regular programs
  });

  const { data: batches, isLoading: isLoadingBatches, error: batchesError } = useQuery<Batch[], Error>({
    queryKey: ["batches", user?.role, user?.user_id],
    queryFn: () => {
      if (isManager) {
        return fetchBatches(); // Managers see all batches
      }
      if (isVolunteer) {
        return fetchMyAssignedBatches(); // Volunteers only see their assigned batches
      }
      // For Attendees, fetch enrolled batches
      return fetchMyEnrolledBatches();
    },
    enabled: !!user,
  });

  React.useEffect(() => {
    if (isManager && programsError) {
      toast.error("Error loading programs", { description: programsError.message });
    }
    if (batchesError) {
      toast.error("Error loading classes", { description: batchesError.message });
    }
  }, [programsError, batchesError, isManager]);

  const isLoading = isLoadingPrograms || isLoadingBatches;

  return (
    <div className="container mx-auto p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Programs & Classes</h1>

        {isManager && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Create New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsCreateProgramDialogOpen(true)} className="flex items-center gap-2 cursor-pointer">
                <Calendar className="h-4 w-4" />
                New Program
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCreateBatchDialogOpen(true)} className="flex items-center gap-2 cursor-pointer">
                <LayoutGrid className="h-4 w-4" />
                New Class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>


      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mb-8">
        Manage your fixed-duration spiritual programs and recurring daily or weekly classes.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Render regular programs */}
          {isManager && programs?.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}

          {/* Render recurring classes (batches) */}
          {batches?.map((batch) => (
            <BatchCard key={batch.id} batch={batch} showAdminControls={isManager} />
          ))}

          {(!isManager || (!programs || programs.length === 0)) && (!batches || batches.length === 0) && (
            <div className="col-span-full text-center py-20">
              <p className="text-gray-500 text-xl">No activities found.</p>
              <p className="text-gray-500">
                {isManager ? "Create a new program or class to get started." : "You are not enrolled in any programs or classes yet."}
              </p>
            </div>
          )}
        </div>
      )}

      <CreateProgramDialog
        isOpen={isCreateProgramDialogOpen}
        onOpenChange={setIsCreateProgramDialogOpen}
      />

      <CreateBatchDialog
        isOpen={isCreateBatchDialogOpen}
        onOpenChange={setIsCreateBatchDialogOpen}
      />
    </div>
  );
};

export default Programs;