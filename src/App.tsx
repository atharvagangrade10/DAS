import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Friends from "./pages/Friends";
import Attendance from "./pages/Attendance";
import Programs from "./pages/Programs";
import ParticipantsPage from "./pages/Participants";
import Stats from "./pages/Stats";
import YatraPage from "./pages/Yatra";
import ProfilePage from "./pages/Profile";
import PaymentHistory from "./pages/PaymentHistory";
import RegisterVerification from "./pages/RegisterVerification";
import RegisterFullForm from "./pages/RegisterFullForm";
import PublicSetPassword from "./pages/PublicSetPassword";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Layout from "./components/Layout";
import LoaderPage from "./components/LoaderPage";
import React from "react";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role !== 'Manager') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const DevoteeFriendRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role !== 'DevoteeFriend' && user?.role !== 'Manager') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  const { isLoading: isAuthLoading } = useAuth();
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

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterVerification />} />
            <Route path="/register/full" element={<RegisterFullForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/public/set-password" element={<PublicSetPassword />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="payments" element={<PaymentHistory />} />

                {/* Devotee Friend / Manager Routes */}
                <Route path="friends" element={<DevoteeFriendRoute><Friends /></DevoteeFriendRoute>} />

                {/* Manager Only Routes */}
                <Route path="attendance" element={<ManagerRoute><Attendance /></ManagerRoute>} />
                <Route path="programs" element={<ManagerRoute><Programs /></ManagerRoute>} />
                <Route path="yatra" element={<ManagerRoute><YatraPage /></ManagerRoute>} />
                <Route path="participants" element={<ManagerRoute><ParticipantsPage /></ManagerRoute>} />
                <Route path="stats" element={<ManagerRoute><Stats /></ManagerRoute>} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;