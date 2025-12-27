"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, History, Info, ReceiptText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PaymentHistory = () => {
  // Empty array as we are not using dummy data anymore
  const payments: any[] = [];

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
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="bg-muted p-4 rounded-full">
                <ReceiptText className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No payments found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  You haven't made any online payments yet. Once you register for a Yatra or program, it will appear here.
                </p>
              </div>
            </div>
          ) : (
            // Table would go here if we had real data
            <p>Payment data display is ready for integration.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;