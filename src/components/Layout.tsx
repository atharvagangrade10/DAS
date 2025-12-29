"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import SidebarNav from "./SidebarNav";

import { useIsMobile } from "@/hooks/use-mobile";

const Layout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <SidebarNav />
      <div className="flex flex-col flex-1 h-full min-w-0">
        <main className={`flex-1 overflow-y-auto p-4 ${isMobile ? "pt-20" : ""}`}>
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>

        </main>
      </div>
    </div>
  );
};

export default Layout;