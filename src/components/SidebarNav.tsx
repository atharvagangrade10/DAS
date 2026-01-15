"use client";

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon, LogOut, User, Settings, Zap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} onClick={onClick}>
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
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const isManager = user?.role === 'Manager';
  const isDevoteeFriend = user?.role === 'DevoteeFriend' || isManager;

  const handleLinkClick = () => {
    if (isMobile) setIsOpen(false);
  };

  const navItems = (
    <nav className="flex flex-col space-y-1 p-4 flex-1">
      <NavLink to="/" onClick={handleLinkClick}>Home</NavLink>
      <NavLink to="/sadhana" onClick={handleLinkClick}>
        <Zap className="mr-2 h-5 w-5" />
        My Sadhana
      </NavLink>
      <NavLink to="/payments" onClick={handleLinkClick}>Payment History</NavLink>

      {isDevoteeFriend && (
        <NavLink to="/friends" onClick={handleLinkClick}>Devotee Friend</NavLink>
      )}

      <NavLink to="/programs" onClick={handleLinkClick}>Programs</NavLink>

      {(isManager || user?.role === 'Volunteer') && (
        <NavLink to="/attendance" onClick={handleLinkClick}>Attendance</NavLink>
      )}

      {isManager && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="manager-tools" className="border-none">
            <AccordionTrigger className="px-4 py-4 text-lg font-medium text-sidebar-foreground hover:no-underline hover:bg-sidebar-accent/50 rounded-md">
              Manager
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-2 space-y-1">
              <NavLink to="/yatra" onClick={handleLinkClick}>Yatra</NavLink>
              <NavLink to="/participants" onClick={handleLinkClick}>Participants</NavLink>
              <NavLink to="/stats" onClick={handleLinkClick}>Stats</NavLink>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

    </nav>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-3 font-bold text-2xl text-primary">
          <img src="/Logo.png" alt="Logo" className="h-10 w-10" />
          DAS
        </Link>
      </div>

      {navItems}

      <div className="p-4 border-t mt-auto bg-sidebar-background/50">
        {user && (
          <div className="mb-4 flex flex-col gap-3 px-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsProfileDialogOpen(true)}
                className="relative group transition-transform hover:scale-105"
                aria-label="View profile photo"
              >
                <Avatar className="h-10 w-10 border border-primary/20 cursor-pointer ring-2 ring-primary/30 hover:ring-primary/50 transition-all">
                  {user.profile_photo_url ? (
                    <AvatarImage
                      key={user.profile_photo_url}
                      src={user.profile_photo_url}
                      alt={user.full_name}
                      className="object-cover h-full w-full"
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.phone}</p>
              </div>
            </div>
            <Button
              variant="default"
              className="w-full text-xs h-8 bg-black text-white hover:bg-gray-800 hover:text-white font-medium transition-colors"
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

      {/* Profile Photo Enlarged View Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg font-semibold">Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="p-4 flex justify-center bg-black/5">
            {user?.profile_photo_url ? (
              <img
                src={user.profile_photo_url}
                alt={user.full_name}
                className="w-full h-auto rounded-lg shadow-lg max-h-[80vh] object-contain"
              />
            ) : (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SidebarNav;