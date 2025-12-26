"use client";

import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Yatra } from "@/types/yatra";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchYatras } from "@/utils/api";
import CreateYatraDialog from "@/components/CreateYatraDialog";
import YatraCard from "@/components/YatraCard";

const YatraPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const { data: yatras, isLoading, error } = useQuery<Yatra[], Error>({
    queryKey: ["yatras"],
    queryFn: fetchYatras,
  });

  React.useEffect(() => {
    if (error) {
      toast.error("Error loading Yatras", {
        description: error.message,
      });
    }
  }, [error]);

  return (
    <div className="container mx-auto p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Yatra Management</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Create New Yatra
        </Button>
      </div>
      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mb-8">
        Organize and manage all your spiritual trips and pilgrimages (Yatras).
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500">Error: {error.message}</p>
      ) : yatras && yatras.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {yatras.map((yatra) => (
            <YatraCard key={yatra.id} yatra={yatra} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 text-xl">No Yatras found.</p>
          <p className="text-gray-500">Click "Create New Yatra" to add your first trip.</p>
        </div>
      )}

      <CreateYatraDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

export default YatraPage;