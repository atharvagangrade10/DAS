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

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: invoice.amount,
      currency: invoice.currency,
      name: "DAS Yatra Registration",
      description: `${invoice.yatra_name} - ${invoice.fee_category}`,
      // We must pass the order_id for signature verification to work correctly on the backend
      order_id: invoice.order_id, 
      handler: async (response: any) => {
        const verificationToastId = toast.loading("Verifying payment...");
        try {
            // Ensure we send the razorpay_order_id. Fallback to invoice.order_id if the response one is missing
            const verificationData = await verifyPayment(yatraId, {
                razorpay_order_id: response.razorpay_order_id || invoice.order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
            });

            toast.dismiss(verificationToastId);

            if (verificationData.status === "success") {
                onSuccess(response);
            } else {
                onFailure({
                    description: "Payment verification failed. Please contact support with your payment ID.",
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