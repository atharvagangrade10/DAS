"use client";

import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Program } from "@/types/program";
import CreateProgramDialog from "@/components/CreateProgramDialog";
import ProgramCard from "@/components/ProgramCard";
import { Skeleton } from "@/components/ui/skeleton";

const fetchPrograms = async (): Promise<Program[]> => {
  const response = await fetch("https://das-backend-o43a.onrender.com/program/");
  if (!response.ok) {
    throw new Error("Failed to fetch programs");
  }
  return response.json();
};

const Programs = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const { data: programs, isLoading, error } = useQuery<Program[], Error>({
    queryKey: ["programs"],
    queryFn: fetchPrograms,
  });

  React.useEffect(() => {
    if (error) {
      toast.error("Error loading programs", {
        description: error.message,
      });
    }
  }, [error]);

  return (
    <div className="container mx-auto p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Programs Management</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Create New Program
        </Button>
      </div>
      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mb-8">
        Here you can create, edit, and organize all your spiritual programs and events, and manage their sessions.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500">Error: {error.message}</p>
      ) : programs && programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 text-xl">No programs found.</p>
          <p className="text-gray-500">Click "Create New Program" to add your first program.</p>
        </div>
      )}

      <CreateProgramDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

export default Programs;