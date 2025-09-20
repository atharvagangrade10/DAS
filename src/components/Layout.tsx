"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import SidebarNav from "./SidebarNav";
import { MadeWithDyad } from "./made-with-dyad";
import { useIsMobile } from "@/hooks/use-mobile";

const Layout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-col flex-1">
        <main className={`flex-1 p-4 ${isMobile ? "pt-20" : ""}`}>
          <Outlet />
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Layout;