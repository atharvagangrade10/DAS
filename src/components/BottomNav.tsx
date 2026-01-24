"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Zap, BarChart2, Calendar, MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
    onMenuClick: () => void;
}

const navItems = [
    { icon: Home, label: "Home", to: "/" },
    { icon: Zap, label: "Sadhana", to: "/sadhana" },
    { icon: BarChart2, label: "Insights", to: "/sadhana/insights" },
    { icon: Calendar, label: "Programs", to: "/programs" },
];

const BottomNav: React.FC<BottomNavProps> = ({ onMenuClick }) => {
    const location = useLocation();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ icon: Icon, label, to }) => {
                    const isActive = location.pathname === to || (to !== "/" && location.pathname === to);

                    return (
                        <Link
                            key={to}
                            to={to}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium uppercase tracking-tighter">
                                {label}
                            </span>
                            {isActive && (
                                <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full translate-y-[-1px]" />
                            )}
                        </Link>
                    );
                })}

                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <MenuIcon className="h-5 w-5" />
                    <span className="text-[10px] font-medium uppercase tracking-tighter">
                        More
                    </span>
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
