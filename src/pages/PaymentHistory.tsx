"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, History, Info, ReceiptText, IndianRupee, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { fetchPaymentHistory } from "@/utils/api";
import { PaymentRecord } from "@/types/yatra";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

const PaymentHistory = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { data: payments, isLoading, error } = useQuery<PaymentRecord[], Error>({
    queryKey: ["paymentHistory", user?.user_id],
    queryFn: () => fetchPaymentHistory(user!.user_id),
    enabled: !!user?.user_id,
  });

  React.useEffect(() => {
    if (error) {
      toast.error("Error loading payment history", {
        description: error.message,
      });
    }
  }, [error]);

  const getStatusBadge = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case "success":
      case "paid":
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-500 text-white">Success</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
      case "refunded":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderMobileView = (payments: PaymentRecord[]) => (
    <div className="space-y-4">
      {payments.map((payment) => (
        <Card key={payment.transaction_id || Math.random().toString()} className="shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">{payment.yatra_name}</span>
              {getStatusBadge(payment.status)}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{format(parseISO(payment.date), "MMM dd, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold flex items-center">
                <IndianRupee className="h-3 w-3 mr-1" />
                {payment.amount}
              </span>
            </div>
            {payment.receipt_url && (
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View Receipt
                  </a>
                </Button>
              </div>
            )}
            <div className="text-xs text-muted-foreground break-all">
              Txn ID: {payment.transaction_id || "N/A"}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDesktopTable = (payments: PaymentRecord[]) => (
    <ScrollArea className="h-[400px] w-full border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Yatra Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount (₹)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
            <TableHead className="w-[200px]">Transaction ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.transaction_id || Math.random().toString()}>
              <TableCell className="font-medium">{payment.yatra_name}</TableCell>
              <TableCell>{format(parseISO(payment.date), "MMM dd, yyyy")}</TableCell>
              <TableCell className="text-right font-semibold">{payment.amount}</TableCell>
              <TableCell>{getStatusBadge(payment.status)}</TableCell>
              <TableCell>
                {payment.receipt_url ? (
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
                    <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Receipt
                    </a>
                  </Button>
                ) : "-"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground break-all">{payment.transaction_id || "N/A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );

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
          This history includes payments made via the online portal. Receipts are available for completed transactions.
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
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <p className="text-red-500">Error loading history: {error.message}</p>
          ) : payments && payments.length > 0 ? (
            isMobile ? renderMobileView(payments) : renderDesktopTable(payments)
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;