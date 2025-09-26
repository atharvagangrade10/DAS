import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Friends from "./pages/Friends";
import Attendance from "./pages/Attendance";
import Programs from "./pages/Programs";
import ParticipantsPage from "./pages/Participants";
import Stats from "./pages/Stats"; // Import the new Stats page
import Layout from "./components/Layout";
import LoaderPage from "./components/LoaderPage";
import React from "react";

const queryClient = new QueryClient();

const App = () => {
  const [isAppReady, setIsAppReady] = React.useState(false);

  const handleLoadingComplete = () => {
    setIsAppReady(true);
  };

  if (!isAppReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Sonner />
        <LoaderPage onLoadingComplete={handleLoadingComplete} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="friends" element={<Friends />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="programs" element={<Programs />} />
              <Route path="participants" element={<ParticipantsPage />} />
              <Route path="stats" element={<Stats />} /> {/* Add the new route */}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;