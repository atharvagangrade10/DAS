"use client";

import React from "react";
import { toast } from "sonner";
import { RAZORPAY_KEY_ID } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { RazorpayOrderResponse, verifyPayment } from "@/utils/api"; // Import verifyPayment

// Extend Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  yatraId: string; // Added yatraId for verification step
  order: RazorpayOrderResponse;
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

  const displayRazorpay = React.useCallback(({ yatraId, order, onSuccess, onFailure }: PaymentOptions) => {
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
      amount: order.amount, // Amount is in smallest currency unit (e.g., paise)
      currency: order.currency,
      name: "DAS Yatra Registration",
      description: `${order.yatra_name} - ${order.fee_category}`,
      order_id: order.id, // Use order.id from the backend response
      handler: async (response: any) => {
        // Step 3: Verify Payment on the backend
        const verificationToastId = toast.loading("Verifying payment...");
        try {
            const verificationData = await verifyPayment(yatraId, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
            });

            toast.dismiss(verificationToastId);

            if (verificationData.status === "success") {
                onSuccess(response);
            } else {
                // Verification failed, but payment might have succeeded on Razorpay side.
                // This usually means a security issue or data mismatch.
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
        fee_category: order.fee_category,
        participant_id: user.user_id,
      },
      theme: {
        color: "#3b82f6", // Tailwind blue-500
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