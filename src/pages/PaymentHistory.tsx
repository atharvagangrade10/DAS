"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, History, Info } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock data for demo purposes
const MOCK_PAYMENTS = [
  {
    id: "PAY-001",
    item: "Vrindavan Kartik Yatra",
    category: "Full Package",
    amount: 5000,
    date: "2023-10-15T10:00:00Z",
    status: "Completed",
    method: "UPI",
  },
  {
    id: "PAY-002",
    item: "Mayapur Festival",
    category: "Accommodation",
    amount: 2500,
    date: "2023-11-20T14:30:00Z",
    status: "Completed",
    method: "Net Banking",
  },
  {
    id: "PAY-003",
    item: "Jagannath Puri Yatra",
    category: "Travel Only",
    amount: 1200,
    date: "2024-01-05T09:15:00Z",
    status: "Processing",
    method: "Card",
  },
];

const PaymentHistory = () => {
  return (
    <div className="container mx-auto p-6 sm:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-full">
          <History className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Payment History</h1>
          <p className="text-gray-500">Track all your registrations and transaction details.</p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>
          This history includes payments made via the online portal. For offline registrations, please contact the manager.
        </AlertDescription>
      </Alert>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>A list of your recent yatra and program payments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Event / Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PAYMENTS.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                    <TableCell className="font-medium">{payment.item}</TableCell>
                    <TableCell>{payment.category}</TableCell>
                    <TableCell>{format(new Date(payment.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell className="text-right font-bold">₹{payment.amount}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={payment.status === "Completed" ? "default" : "secondary"}
                        className={payment.status === "Completed" ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" : ""}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;