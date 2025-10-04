"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MobileStatCardProps {
  title: string;
  value: number | string;
  description: string;
  id: string; // Added id for easier referencing during capture
}

const MobileStatCard: React.FC<MobileStatCardProps> = ({ title, value, description, id }) => {
  return (
    <Card className="shadow-lg" id={id}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default MobileStatCard;