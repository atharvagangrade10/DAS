"use client";

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon, LogOut, User, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";

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
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const isManager = user?.role === 'Manager';

  const navItems = (
    <nav className="flex flex-col space-y-1 p-4 flex-1">
      <NavLink to="/">Home</NavLink>
      {isManager && (
        <>
          <NavLink to="/friends">Friends</NavLink>
          <NavLink to="/attendance">Attendance</NavLink>
          <NavLink to="/programs">Programs</NavLink>
          <NavLink to="/yatra">Yatra</NavLink>
          <NavLink to="/participants">Participants</NavLink>
          <NavLink to="/stats">Stats</NavLink>
        </>
      )}
    </nav>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-primary">
          DAS
        </Link>
      </div>
      
      {navItems}
      
      <div className="p-4 border-t mt-auto bg-sidebar-background/50">
        {user && (
          <div className="mb-4 flex flex-col gap-3 px-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.phone}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs h-8"
              onClick={() => {
                navigate('/profile');
                if (isMobile) setIsOpen(false);
              }}
            >
              <Settings className="mr-2 h-3 w-3" />
              Manage Profile
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border shadow-sm">
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Toggle navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-r shadow-xl">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      ) : (
        <div className="hidden md:flex flex-col h-screen w-64 border-r bg-sidebar-background text-sidebar-foreground sticky top-0">
          {sidebarContent}
        </div>
      )}
    </>
  );
};

export default SidebarNav;