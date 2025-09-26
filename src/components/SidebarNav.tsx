"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-lg py-6",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        )}
      >
        {children}
      </Button>
    </Link>
  );
};

const SidebarNav = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = (
    <nav className="flex flex-col space-y-2 p-4">
      <NavLink to="/friends">Friends</NavLink>
      <NavLink to="/attendance">Attendance</NavLink>
      <NavLink to="/programs">Programs</NavLink>
      <NavLink to="/participants">Participants</NavLink>
      <NavLink to="/stats">Stats</NavLink> {/* New NavLink for Stats */}
    </nav>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Toggle navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar-background bg-background">
            <div className="flex h-16 items-center border-b px-4">
              <Link to="/" className="flex items-center gap-2 font-semibold text-xl text-sidebar-primary">
                DAS
              </Link>
            </div>
            {navItems}
          </SheetContent>
        </Sheet>
      ) : (
        <div className="hidden md:flex flex-col h-screen w-64 border-r bg-sidebar-background text-sidebar-foreground">
          <div className="flex h-16 items-center border-b px-4">
            <Link to="/" className="flex items-center gap-2 font-semibold text-xl text-sidebar-primary">
              DAS
            </Link>
          </div>
          {navItems}
        </div>
      )}
    </>
  );
};

export default SidebarNav;