"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReceiptText, Download, Calendar, User, CreditCard, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { ReceiptResponse } from "@/types/yatra";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: ReceiptResponse | null;
}

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({ isOpen, onOpenChange, receiptData }) => {
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (!receiptData || !receiptRef.current) return;

    try {
      toast.loading("Generating receipt image...");

      // Capture the receipt content as canvas
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Convert canvas to image and download
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `receipt_${receiptData.yatra_name.replace(/\s+/g, "_")}_${receiptData.participant_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss();
      toast.success("Receipt image downloaded successfully!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.dismiss();
      toast.error("Failed to generate receipt", {
        description: "Please try again or contact support.",
      });
    }
  };

  if (!receiptData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5" />
            Payment Receipt Details for {receiptData.yatra_name}
          </DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="p-8 bg-white space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/Logo.png"
              alt="Logo"
              className="h-44"
              onError={(e) => console.log("Logo failed to load")}
            />
          </div>

          {/* Receipt Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">PAYMENT RECEIPT</h2>
            <p className="text-gray-600 text-sm mt-1">
              Generated on {format(new Date(), "PPP")}
            </p>
          </div>

          {/* Yatra Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Yatra Name</p>
                <p className="text-gray-800">{receiptData.yatra_name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Dates</p>
              <p className="text-gray-800">
                {format(new Date(receiptData.yatra_start_date), "MMM dd, yyyy")} to{" "}
                {format(new Date(receiptData.yatra_end_date), "MMM dd, yyyy")}
              </p>
            </div>
          </div>

          {/* Participant Details */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <User className="w-4 h-4" />
              Participant Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-600 font-semibold w-1/3">Name</span>
                <span className="text-gray-800 text-right w-2/3">{receiptData.participant_name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-600 font-semibold w-1/3">ID</span>
                <span className="text-gray-800 text-right w-2/3 break-all">{receiptData.participant_id}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4" />
              Payment Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600 font-semibold">Amount</span>
                <span className="text-gray-800 font-semibold">₹ {receiptData.payment_amount}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600 font-semibold">Status</span>
                <span
                  className={`px-3 py-0 rounded-full text-xs font-semibold h-fit ${receiptData.payment_status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                    }`}
                >
                  {receiptData.payment_status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600 font-semibold">Order ID</span>
                <span className="text-gray-800 font-mono text-xs">{receiptData.razorpay_order_id}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 font-semibold">Payment ID</span>
                <span className="text-gray-800 font-mono text-xs">{receiptData.razorpay_payment_id}</span>
              </div>
            </div>
          </div>

          {/* Registration Status */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 font-semibold mb-3">Registration Status</p>
            <p
              className={`px-3 py-2 rounded w-fit text-sm font-semibold whitespace-nowrap ${receiptData.is_registered
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-red-800"
                }`}
            >
              {receiptData.is_registered ? "Registered" : "Not Registered"}
            </p>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-center text-xs text-gray-500">
            <p>This is an electronic receipt. No signature required.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownloadImage} className="gap-2">
            <Download className="w-4 h-4" />
            Download Receipt (Image)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDialog;