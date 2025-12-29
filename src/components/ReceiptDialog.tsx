"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReceiptText, Download, Calendar, User, CreditCard, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { ReceiptResponse } from "@/types/yatra";
import html2canvas from "html2canvas";

interface ReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: ReceiptResponse | null;
}

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({ isOpen, onOpenChange, receiptData }) => {
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!receiptData || !receiptRef.current) return;

    try {
      // Capture the receipt content as an image
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      // Convert canvas to data URL
      const imgData = canvas.toDataURL('image/png');
      
      // Create a simple HTML document for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${receiptData.yatra_name}</title>
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .container { width: 210mm; margin: 0 auto; padding: 20mm; box-sizing: border-box; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15mm; margin-bottom: 15mm; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 12px; color: #666; }
            .section { margin-bottom: 10mm; }
            .label { font-weight: bold; display: inline-block; width: 45mm; }
            .value { color: #333; }
            .footer { margin-top: 15mm; font-size: 10px; color: #666; text-align: center; }
            .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; background-color: #e6f3e6; color: #1f7a1f; font-weight: bold; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">Payment Receipt</div>
              <div class="subtitle">Generated on ${format(new Date(), "PPP")}</div>
            </div>

            <div class="section">
              <div><span class="label">Yatra Name:</span> <span class="value">${receiptData.yatra_name}</span></div>
              <div style="margin-top: 5px;"><span class="label">Yatra Dates:</span> <span class="value">${format(new Date(receiptData.yatra_start_date), "MMM dd, yyyy")} to ${format(new Date(receiptData.yatra_end_date), "MMM dd, yyyy")}</span></div>
              <div style="margin-top: 5px;"><span class="label">Participant:</span> <span class="value">${receiptData.participant_name}</span></div>
              <div style="margin-top: 5px;"><span class="label">Participant ID:</span> <span class="value">${receiptData.participant_id}</span></div>
            </div>

            <div class="section">
              <div><span class="label">Payment Amount:</span> <span class="value">₹${receiptData.payment_amount}</span></div>
              <div style="margin-top: 5px;"><span class="label">Payment Status:</span> <span class="status-badge">${receiptData.payment_status}</span></div>
              <div style="margin-top: 5px;"><span class="label">Razorpay Order ID:</span> <span class="value">${receiptData.razorpay_order_id}</span></div>
              <div style="margin-top: 5px;"><span class="label">Razorpay Payment ID:</span> <span class="value">${receiptData.razorpay_payment_id}</span></div>
            </div>

            <div class="section">
              <div><span class="label">Registration Status:</span> <span class="value">${receiptData.is_registered ? 'Registered' : 'Not Registered'}</span></div>
            </div>

            <div class="footer">
              This is an electronic receipt. No signature required.
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${receiptData.yatra_name.replace(/\s+/g, '_')}_${receiptData.participant_id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate receipt", {
        description: "Please try again or contact support.",
      });
    }
  };

  const handleDownloadImage = async () => {
    if (!receiptData || !receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `receipt_${receiptData.yatra_name.replace(/\s+/g, '_')}_${receiptData.participant_id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate receipt image", {
        description: "Please try again or contact support.",
      });
    }
  };

  if (!receiptData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-6 w-6 text-primary" />
            Payment Receipt
          </DialogTitle>
          <DialogDescription>
            Details for {receiptData.yatra_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div ref={receiptRef} className="space-y-4">
            <div className="grid gap-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Yatra Name</span>
                <span>{receiptData.yatra_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Dates</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(receiptData.yatra_start_date), "MMM dd, yyyy")} - {format(new Date(receiptData.yatra_end_date), "MMM dd, yyyy")}
                </span>
              </div>
            </div>

            <div className="grid gap-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-semibold">Participant</span>
              </div>
              <div className="grid gap-2 pl-6">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span>{receiptData.participant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>ID:</span>
                  <span className="text-sm text-muted-foreground">{receiptData.participant_id}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="font-semibold">Payment Details</span>
              </div>
              <div className="grid gap-2 pl-6">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold flex items-center">
                    <IndianRupee className="h-3 w-3 mr-1" />
                    {receiptData.payment_amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    receiptData.payment_status.toLowerCase() === 'completed' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {receiptData.payment_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="text-sm text-muted-foreground">{receiptData.razorpay_order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment ID:</span>
                  <span className="text-sm text-muted-foreground">{receiptData.razorpay_payment_id}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">Registration Status</span>
              </div>
              <div className="flex justify-between">
                <span>Registered:</span>
                <span className={`font-semibold ${
                  receiptData.is_registered 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {receiptData.is_registered ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="space-y-2">
          <Button onClick={handleDownloadPDF} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download as HTML
          </Button>
          <Button variant="outline" onClick={handleDownloadImage} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download as Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDialog;