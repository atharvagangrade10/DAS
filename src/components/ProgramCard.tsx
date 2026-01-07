"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, CalendarDays, Trash2, Calendar } from "lucide-react";
import { Program } from "@/types/program";
import { format } from "date-fns";
import EditProgramDialog from "./EditProgramDialog";
import ProgramSessionsDialog from "./ProgramSessionsDialog";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";

interface ProgramCardProps {
  program: Program;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('das_auth_token');
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const deleteProgram = async (programId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/program/${programId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete program' }));
    throw new Error(errorData.detail || "Failed to delete program");
  }
};

const ProgramCard: React.FC<ProgramCardProps> = ({ program }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isSessionsDialogOpen, setIsSessionsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => {
      toast.success("Program deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["allAttendedPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["allAttendedProgramsForStats"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete program", {
        description: error.message,
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(program.id);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="w-fit text-blue-600 border-blue-200">Program</Badge>
          <CardTitle className="text-2xl font-semibold mt-1">{program.program_name}</CardTitle>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSessionsDialogOpen(true)}>
            <CalendarDays className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
            <span className="sr-only">Manage sessions</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
            <span className="sr-only">Edit program</span>
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200">
                <Trash2 className="h-5 w-5" />
                <span className="sr-only">Delete program</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the program{" "}
                  <span className="font-semibold">{program.program_name}</span> and all its associated sessions and attendance records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 grid gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{program.description || "No description provided."}</p>
        <p className="text-sm">
          <strong>Start Date:</strong> {format(new Date(program.start_date), "PPP")}
        </p>
        <p className="text-sm">
          <strong>End Date:</strong> {format(new Date(program.end_date), "PPP")}
        </p>
      </CardContent>

      <EditProgramDialog
        program={program}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
      <ProgramSessionsDialog
        program={program}
        isOpen={isSessionsDialogOpen}
        onOpenChange={setIsSessionsDialogOpen}
      />
    </Card>
  );
};

export default ProgramCard;