"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // New import
import { API_BASE_URL } from "@/config/api";

interface LoaderPageProps {
  onLoadingComplete: () => void;
}

const HEALTH_CHECK_URL = `${API_BASE_URL}/health`;
const SWITCH_DATABASE_URL = `${API_BASE_URL}/switch-database`;
const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 20 * 1000; // 20 seconds

const LoaderPage: React.FC<LoaderPageProps> = ({ onLoadingComplete }) => {
  const [loadingMessage, setLoadingMessage] = React.useState(
    "Hare Krishna, please wait. Your DAS is loading DATA...",
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initializeApp = async () => {
      let retries = 0;
      let healthCheckSuccess = false;

      // Health Check Loop
      while (retries < MAX_RETRIES && !healthCheckSuccess) {
        try {
          setLoadingMessage(
            `Hare Krishna, please wait. Your DAS is loading DATA... (Attempt ${retries + 1
            }/${MAX_RETRIES})`,
          );
          const healthResponse = await fetch(HEALTH_CHECK_URL);
          if (healthResponse.ok) {
            healthCheckSuccess = true;
            console.log("Health check successful.");
          } else {
            const errorText = await healthResponse.text();
            console.warn(
              `Health check failed (status: ${healthResponse.status}). Retrying... Error: ${errorText}`,
            );
            retries++;
            if (retries < MAX_RETRIES) {
              await new Promise((resolve) =>
                setTimeout(resolve, RETRY_INTERVAL_MS),
              );
            }
          }
        } catch (err) {
          console.error("Health check failed due to network error:", err);
          retries++;
          if (retries < MAX_RETRIES) {
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_INTERVAL_MS),
            );
          }
        }
      }

      if (!healthCheckSuccess) {
        setError(
          "Failed to connect to the backend after multiple attempts. Please try again later.",
        );
        toast.error("Application failed to load", {
          description: "Backend health check failed.",
        });
        return;
      }

      // Switch Database
      try {
        // Keep the loading message general, do not explicitly state "Switching database..."
        setLoadingMessage("Hare Krishna, please wait. Your DAS is loading DATA...");
        const switchDbResponse = await fetch(SWITCH_DATABASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ database: "iskcon_congregation" }),
        });

        if (!switchDbResponse.ok) {
          const errorData = await switchDbResponse.json();
          throw new Error(
            errorData.detail || "Failed to switch database.",
          );
        }
        console.log("Database switched successfully.");
        onLoadingComplete(); // Signal App.tsx that loading is complete
      } catch (err: any) {
        console.error("Failed to switch database:", err);
        setError(`Failed to initialize application: ${err.message}`);
        toast.error("Application failed to load", {
          description: `Failed to switch database: ${err.message}`,
        });
      }
    };

    initializeApp();
  }, [onLoadingComplete]);

  return (
    <div className="flex items-center justify-center h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Application Loading</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {error ? (
            <div className="text-red-500 text-lg font-semibold">
              <p className="mb-4">Error: {error}</p>
              <p>Please check your internet connection or contact support.</p>
            </div>
          ) : (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {loadingMessage}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoaderPage;