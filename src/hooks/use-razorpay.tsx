"use client";

import React from "react";
import { toast } from "sonner";
import { RAZORPAY_KEY_ID } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { RazorpayInvoiceResponse, verifyPayment } from "@/utils/api";

// Extend Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  yatraId: string;
  invoice: RazorpayInvoiceResponse;
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
}

const useRazorpay = () => {
  const { user } = useAuth();
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(false);

  React.useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => {
          setIsScriptLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          setIsScriptLoaded(false);
          toast.error("Payment script failed to load.", {
            description: "Please check your network connection.",
          });
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    if (!window.Razorpay) {
      loadScript("https://checkout.razorpay.com/v1/checkout.js");
    } else {
      setIsScriptLoaded(true);
    }
  }, []);

  const displayRazorpay = React.useCallback(({ yatraId, invoice, onSuccess, onFailure }: PaymentOptions) => {
    if (!isScriptLoaded || !window.Razorpay) {
      toast.error("Razorpay script not loaded yet. Please try again.");
      return;
    }

    if (!user) {
        toast.error("Authentication error", { description: "User details missing." });
        return;
    }

    // Determine the actual Order ID. 
    // Based on logs, invoice.id often contains the 'order_...' string.
    const actualOrderId = invoice.order_id || (invoice.id?.startsWith('order_') ? invoice.id : null);

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: invoice.amount,
      currency: invoice.currency,
      name: "DAS Yatra Registration",
      description: `${invoice.yatra_name} - ${invoice.fee_category}`,
      // Pass the correct order_id to enable signature generation
      order_id: actualOrderId, 
      handler: async (response: any) => {
        console.log("Razorpay Response Received:", response);
        const verificationToastId = toast.loading("Verifying payment...");
        
        try {
            // Defensively map the payload. 
            // We ensure we send the order_id we used to initiate the payment if Razorpay doesn't return it.
            const payload = {
                razorpay_order_id: response.razorpay_order_id || actualOrderId || null,
                razorpay_invoice_id: response.razorpay_invoice_id || (invoice.id?.startsWith('inv_') ? invoice.id : null) || invoice.id || null,
                razorpay_payment_id: response.razorpay_payment_id || null,
                razorpay_signature: response.razorpay_signature || response.razorpay_invoice_signature || null,
            };

            console.log("Sending Verification Payload:", payload);

            if (!payload.razorpay_signature) {
                console.error("Signature missing in Razorpay response. Options used:", options);
                throw new Error("Payment signature could not be found. Please ensure the backend provides a valid Razorpay Order ID.");
            }

            const verificationData = await verifyPayment(yatraId, payload);

            toast.dismiss(verificationToastId);

            if (verificationData.status === "success") {
                onSuccess(response);
            } else {
                onFailure({
                    description: "Payment verification failed. Please contact support.",
                    error: verificationData,
                });
            }
        } catch (error: any) {
            toast.dismiss(verificationToastId);
            onFailure({
                description: error.message || "An error occurred during payment verification.",
                error: error,
            });
        }
      },
      prefill: {
        name: user.full_name,
        email: user.email || "",
        contact: user.phone,
      },
      notes: {
        yatra_id: yatraId,
        fee_category: invoice.fee_category,
        participant_id: user.user_id,
        invoice_id: invoice.id
      },
      theme: {
        color: "#3b82f6",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
        onFailure(response.error);
    });
    rzp.open();
  }, [isScriptLoaded, user]);

  return {
    isRazorpayReady: isScriptLoaded,
    displayRazorpay,
  };
};

export default useRazorpay;