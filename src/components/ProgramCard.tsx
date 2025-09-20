"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, CalendarDays } from "lucide-react";
import { Program } from "@/types/program";
import { format } from "date-fns";
import EditProgramDialog from "./EditProgramDialog";
import ProgramSessionsDialog from "./ProgramSessionsDialog";

interface ProgramCardProps {
  program: Program;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isSessionsDialogOpen, setIsSessionsDialogOpen] = React.useState(false);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-semibold">{program.program_name}</CardTitle>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSessionsDialogOpen(true)}>
            <CalendarDays className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
            <span className="sr-only">Manage sessions</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
            <span className="sr-only">Edit program</span>
          </Button>
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