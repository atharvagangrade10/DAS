"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;