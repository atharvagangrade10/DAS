"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Moon, Zap, BookOpen, Users, Dumbbell, BarChart3, Star, Sparkles } from "lucide-react";

export type InsightCategory = "overall" | "sleep" | "chanting" | "reading" | "association" | "arati" | "exercise";

interface InsightNavigationProps {
    activeCategory: InsightCategory;
    onCategoryChange: (category: InsightCategory) => void;
}

const CATEGORIES: { id: InsightCategory; label: string; icon: React.ElementType }[] = [
    { id: "overall", label: "Today", icon: BarChart3 },
    { id: "sleep", label: "Sleep", icon: Moon },
    { id: "chanting", label: "Chanting", icon: Zap },
    { id: "reading", label: "Reading", icon: BookOpen },
    { id: "association", label: "Association", icon: Users },
    { id: "arati", label: "Arati", icon: Star },
    { id: "exercise", label: "Exercise", icon: Dumbbell },
];

const InsightNavigation: React.FC<InsightNavigationProps> = ({ activeCategory, onCategoryChange }) => {
    return (
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex overflow-x-auto sm:flex-wrap no-scrollbar gap-3 pb-4 pt-2 snap-x snap-mandatory">
                {CATEGORIES.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => onCategoryChange(id)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 border shrink-0 whitespace-nowrap snap-start",
                            activeCategory === id
                                ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 font-bold scale-[1.02]"
                                : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted font-medium"
                        )}
                    >
                        <Icon className={cn("h-4 w-4", activeCategory === id ? "text-primary-foreground" : "text-muted-foreground")} />
                        <span className="text-sm">{label}</span>
                    </button>
                ))}
            </div>
            <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
        </div>
    );
};

export default InsightNavigation;